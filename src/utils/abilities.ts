import changedAbilities from "@/data/changed_abilities";
import prisma from "@/lib/prisma";
import { ABILITIES, ENGLISH } from "@/utils/constants";
import {
    clearCollection,
    fetchByPage,
    getDescriptions,
    getEnglishName,
    logCreate,
    logFinish,
    logStart,
} from "@/utils/global";
import { Abilities } from "@prisma/client";
import { Ability, AbilityFlavorText, PokemonClient } from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANT
// ---------------------------------------------------------------------------------------------------------------------

const GEN_IDXS: { [generation: string]: number } = {
    "generation-iii": 0,
    "generation-iv": 3,
    "generation-v": 6,
    "generation-vi": 8,
    "generation-vii": 10,
    "generation-viii": 13,
    "generation-ix": 18,
};

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

type NewAbility = Omit<Abilities, "id">;

const handleCreateAbility = async (pokemonAPI: PokemonClient, id: number): Promise<void> => {
    const ability: Ability = await pokemonAPI.getAbilityById(id);
    const slug: string = ability.name;
    logCreate(slug, id);

    const newAbility: NewAbility = {
        slug: slug,
        name: slug in changedAbilities ? changedAbilities[slug] : getEnglishName(ability.names),
        desc: getDescriptions(
            ability.flavor_text_entries.filter((aft: AbilityFlavorText) => aft.language.name === ENGLISH),
            slug
        ),
        group: GEN_IDXS[ability.generation.name],
    };

    await prisma.abilities.upsert({
        where: { slug: slug },
        update: newAbility,
        create: newAbility,
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createAbilities = async (clear: boolean, start: number): Promise<void> => {
    logStart(ABILITIES, start);
    clearCollection(ABILITIES, clear);

    const pokemonAPI: PokemonClient = new PokemonClient();
    const count: number = (await pokemonAPI.listAbilities()).count;
    await fetchByPage(pokemonAPI, start - 1, count, "listAbilities", handleCreateAbility);

    logFinish(ABILITIES);
};
