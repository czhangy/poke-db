import changedEvos from "@/data/changed_evos";
import changedPokemonAbilities from "@/data/changed_pokemon_abilities";
import changedStats from "@/data/changed_stats";
import groups from "@/data/groups";
import unusedForms from "@/data/unused_forms";
import prisma from "@/lib/prisma";
import { DEFAULT, POKEMON } from "@/utils/constants";
import { clearCollection, getEnglishName, logFinish, logProgress, logStart, removeDuplicates } from "@/utils/global";
import { Learnset, LearnsetMove, PokemonAbilities, Pokemon as PokemonModel, PokemonType, Stats } from "@prisma/client";
import {
    ChainLink,
    EvolutionChain,
    EvolutionClient,
    Pokemon,
    PokemonAbility,
    PokemonClient,
    PokemonForm,
    PokemonSpecies,
    PokemonStat,
    PokemonType as Type,
} from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

const GEN_IDXS: { [generation: string]: number } = {
    "generation-iii": 3,
    "generation-iv": 6,
    "generation-v": 8,
    "generation-vi": 10,
    "generation-vii": 13,
    "generation-viii": 18,
};
const LEVEL_UP: string = "level-up";
const STAT_ORDER: string[] = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

// ---------------------------------------------------------------------------------------------------------------------
// PROPERTIES
// ---------------------------------------------------------------------------------------------------------------------

const getTypes = (pokemon: Pokemon | PokemonForm): PokemonType[] => {
    const types: PokemonType[] = [];
    let currentGroup: number = DEFAULT;

    if ("past_types" in pokemon && pokemon.past_types.length > 0) {
        types.push({
            types: pokemon.past_types[0].types.map((type: Type) => type.type.name),
            group: DEFAULT,
        });
        currentGroup = GEN_IDXS[pokemon.past_types[0].generation.name];
    }

    types.push({
        types: pokemon.types.map((type: Type) => type.type.name),
        group: currentGroup,
    });

    return types;
};

const getEvos = async (
    evolutionAPI: EvolutionClient,
    species: PokemonSpecies
): Promise<[string[] | undefined, string[] | undefined]> => {
    const evos: [string[] | undefined, string[] | undefined] = [undefined, undefined];

    // Fetch evolution chain data from PokeAPI
    const id: number = Number((species.evolution_chain.url.match(/\/evolution-chain\/(\d+)\//) as RegExpMatchArray)[1]);
    const chain: EvolutionChain = await evolutionAPI.getEvolutionChainById(id);

    let cur: [ChainLink, string | undefined] | undefined = [chain.chain, undefined];

    // Find current Pokemon within chain with DFS
    const next: [ChainLink, string | undefined][] = [];
    while (cur && cur[0].species.name !== species.name) {
        // Add all next evolutions to stack
        cur[0].evolves_to.forEach((link: ChainLink) => next.push([link, cur![0].species.name]));
        cur = next.pop();
    }

    // Save previous evolution
    if (cur && cur[1]) {
        evos[0] = [cur[1]];
    }

    // Save next evolutions
    if (cur && cur[0].evolves_to.length > 0) {
        evos[1] = cur[0].evolves_to.map((link: ChainLink) => link.species.name);
    }

    return evos;
};

const getStats = (pokemon: Pokemon): Stats[] => {
    const stats: Stats[] = [];
    let currentGroup: number = DEFAULT;

    if (pokemon.name in changedStats) {
        stats.push({ stats: changedStats[pokemon.name][0], group: DEFAULT });
        currentGroup = changedStats[pokemon.name][1];
    }

    const recent: number[] = [];
    pokemon.stats.forEach((stat: PokemonStat) => (recent[STAT_ORDER.indexOf(stat.stat.name)] = stat.base_stat));
    stats.push({ stats: recent, group: currentGroup });

    return stats;
};

const getAbilities = (pokemon: Pokemon): PokemonAbilities[] => {
    const abilities: PokemonAbilities[] = [];
    let currentGroup: number = DEFAULT;

    if (pokemon.name in changedPokemonAbilities) {
        abilities.push({
            abilities: changedPokemonAbilities[pokemon.name][0],
            group: DEFAULT,
        });
        currentGroup = changedPokemonAbilities[pokemon.name][1];
    }

    const recent: [string, string, string] = ["", "", ""];
    pokemon.abilities.map((ability: PokemonAbility) => (recent[ability.slot - 1] = ability.ability.name));
    abilities.push({
        abilities: recent,
        group: currentGroup,
    });

    return abilities;
};

const getLearnsets = (pokemon: Pokemon): Learnset[] => {
    const versionGroups: { [group: string]: LearnsetMove[] } = {};

    for (const move of pokemon.moves) {
        for (const version of move.version_group_details) {
            const group: string = version.version_group.name;
            if (version.move_learn_method.name === LEVEL_UP && groups.includes(group)) {
                const newMove: LearnsetMove = {
                    move: move.move.name,
                    level: version.level_learned_at,
                };

                if (group in versionGroups) {
                    versionGroups[group].push(newMove);
                } else {
                    versionGroups[group] = [newMove];
                }
            }
        }
    }

    const learnsets: Learnset[] = [];
    for (const [group, moves] of Object.entries(versionGroups)) {
        learnsets.push({
            moves: moves.sort((a: LearnsetMove, b: LearnsetMove) => a.level - b.level),
            group: groups.indexOf(group),
        });
    }
    learnsets.sort((a: Learnset, b: Learnset) => a.group - b.group);
    learnsets[0].group = DEFAULT;

    return removeDuplicates(learnsets, "moves");
};

// ---------------------------------------------------------------------------------------------------------------------
// API CALLERS
// ---------------------------------------------------------------------------------------------------------------------

type NewPokemon = Omit<PokemonModel, "id">;

const handleCreatePokemon = async (
    evolutionAPI: EvolutionClient,
    species: PokemonSpecies,
    pokemon: Pokemon,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    if (!pokemon.sprites.front_default) {
        if (!warnings.missing_sprite) {
            warnings.missing_sprite = [];
        }
        warnings.missing_sprite.push(pokemon.name);
    } else {
        const slug: string = pokemon.name;
        const evos: (string[] | undefined)[] =
            slug in changedEvos ? changedEvos[slug] : await getEvos(evolutionAPI, species);

        const newPokemon: NewPokemon = {
            slug: slug,
            name: getEnglishName(species.names, slug, warnings),
            types: getTypes(pokemon),
            sprite: pokemon.sprites.front_default,
            prevEvolutions: evos[0] ? evos[0] : [],
            nextEvolutions: evos[1] ? evos[1] : [],
            stats: getStats(pokemon),
            abilities: getAbilities(pokemon),
            learnsets: getLearnsets(pokemon),
            formChangeable: species.forms_switchable,
        };

        await prisma.pokemon.upsert({
            where: { slug: slug },
            update: newPokemon,
            create: newPokemon,
        });
    }
};

const handleCreateForm = async (
    evolutionAPI: EvolutionClient,
    species: PokemonSpecies,
    form: PokemonForm,
    pokemon: Pokemon,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    if (!form.sprites.front_default) {
        if (!warnings.missing_sprite) {
            warnings.missing_sprite = [];
        }
        warnings.missing_sprite.push(form.name);
    } else {
        const slug: string = form.name;
        const evos: [string[] | undefined, string[] | undefined] =
            slug in changedEvos ? changedEvos[slug] : await getEvos(evolutionAPI, species);

        const newPokemon: NewPokemon = {
            slug: slug,
            name: getEnglishName(species.names, slug, warnings),
            types: getTypes(form),
            sprite: form.sprites.front_default,
            prevEvolutions: evos[0] ? evos[0] : [],
            nextEvolutions: evos[1] ? evos[1] : [],
            stats: getStats(pokemon),
            abilities: getAbilities(pokemon),
            learnsets: getLearnsets(pokemon),
            formChangeable: species.forms_switchable,
        };

        await prisma.pokemon.upsert({
            where: { slug: slug },
            update: newPokemon,
            create: newPokemon,
        });
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createPokemon = async (
    clear: boolean,
    start: number,
    end: number,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    logStart(POKEMON, start, end);
    await clearCollection(POKEMON, clear);

    const pokemonAPI: PokemonClient = new PokemonClient();
    const evolutionAPI: EvolutionClient = new EvolutionClient();

    const promises: Promise<void>[] = [];
    let progress: number = 0;
    for (let i = start; i <= end; i++) {
        promises.push(
            pokemonAPI
                .getPokemonSpeciesById(i)
                .then(async (species: PokemonSpecies) => {
                    const varietyPromises: Promise<void>[] = [];
                    for (const variety of species.varieties) {
                        if (!unusedForms.some((affix: string) => variety.pokemon.name.includes(affix))) {
                            varietyPromises.push(
                                pokemonAPI.getPokemonByName(variety.pokemon.name).then(async (pokemon: Pokemon) => {
                                    if (pokemon.forms.length === 1) {
                                        await handleCreatePokemon(evolutionAPI, species, pokemon, warnings);
                                    } else {
                                        const formPromises: Promise<void>[] = [];
                                        for (const form of pokemon.forms) {
                                            if (
                                                !unusedForms.some((affix: string) => form.name.includes(affix)) &&
                                                (variety.pokemon.name !== "unown" || form.name === "unown-question")
                                            ) {
                                                formPromises.push(
                                                    pokemonAPI
                                                        .getPokemonFormByName(form.name)
                                                        .then(async (form: PokemonForm) => {
                                                            await handleCreateForm(
                                                                evolutionAPI,
                                                                species,
                                                                form,
                                                                pokemon,
                                                                warnings
                                                            );
                                                        })
                                                );
                                            }
                                        }
                                        await Promise.all(formPromises);
                                    }
                                })
                            );
                        }
                    }
                    await Promise.all(varietyPromises);
                })
                .then(() => {
                    progress++;
                    logProgress(progress, end - start + 1);
                })
        );
    }
    await Promise.all(promises);

    logFinish(POKEMON);
};
