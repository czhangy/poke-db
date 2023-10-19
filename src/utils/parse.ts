import { BattleItems, BattleTags, Battles, PokemonSet } from "@prisma/client";

const fs = require("fs");

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

type NewBattle = Omit<Battles, "id">;

const NUM_HEADERS: number = 2;
const TRAINER: number = 0;
const NAME: number = 1;
const LOCATION: number = 2;
const ITEMS: number = 3;
const REQUIRED: number = 4;
const DOUBLE: number = 5;
const POKEMON: number = 6;
const ABILITY: number = 7;
const HELD_ITEM: number = 8;
const LEVEL: number = 9;
const MOVE_1: number = 10;
const MOVE_4: number = 13;
const IV: number = 14;

const GAME_PREFIXES: { [game: string]: string } = {
    ruby_sapphire: "rs",
    emerald: "emerald",
};

// ---------------------------------------------------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------------------------------------------------

const toSlug = (name: string): string => {
    return name.replace(/[\s_]/g, "-").replace(/[.'~]/g, "").toLowerCase();
};

const getTeam = (group: string[][]): PokemonSet[] => {
    const sets: PokemonSet[] = [];

    group.forEach((row: string[]) => {
        sets.push({
            pokemon: toSlug(row[POKEMON]),
            level: parseInt(row[LEVEL]),
            ability: toSlug(row[ABILITY]),
            moves: row.slice(MOVE_1, MOVE_4 + 1).map((move: string) => toSlug(move)),
            item: toSlug(row[HELD_ITEM]),
            iv: parseInt(row[IV]),
            ev: 0,
        });
    });

    return sets;
};

const getItems = (items: string): BattleItems | null => {
    return items
        ? {
              item: toSlug(items.substring(items.indexOf(" ") + 1)),
              count: parseInt(items.substring(1, items.indexOf("]"))),
          }
        : null;
};

const getTags = (row: string[]): BattleTags[] => {
    const tags: BattleTags[] = [];
    if (row[REQUIRED]) {
        tags.push("required");
    }
    if (row[DOUBLE]) {
        tags.push("double");
    }

    return tags;
};

// ---------------------------------------------------------------------------------------------------------------------
// MAIN COMPONENTS
// ---------------------------------------------------------------------------------------------------------------------

const getNextBattle = (rows: string[], i: number): [string[][], number] => {
    let row: string[] | null = rows[i].split(",");
    const battle: string[][] = [];
    do {
        battle.push(row);
        i++;
        row = i === rows.length ? null : rows[i].split(",");
    } while (row && !row[0]);
    return [battle, i];
};

const getBattleSlug = (game: string, battle: string[]): string => {
    // Extract and process components
    const prefix: string = GAME_PREFIXES[game];

    const trainerWords: string[] = battle[TRAINER].split("_");
    trainerWords.shift();
    const trainer: string = trainerWords.join("_");

    const name: string = battle[NAME].replaceAll(" ", "_").replaceAll("&", "and").toLowerCase();

    // Remove adjacent duplicate component names
    let components: string[] = [prefix, trainer, name];
    components = components.filter((component: string, i: number) => components[i - 1] !== component);

    // Remove adjacent duplicate words
    let words: string[] = components.join("_").split("_");
    words = words.filter((word: string, i: number) => words[i - 1] !== word);

    // Transform into string and remove unnecessary chars
    return words.join("-").replace(/[{}]/g, "");
};

const getBattle = (slug: string, group: string[][]): NewBattle => {
    return {
        slug: slug,
        name: group[0][NAME],
        trainerSlug: toSlug(group[0][TRAINER]),
        location: group[0][LOCATION],
        team: getTeam(group),
        items: getItems(group[0][ITEMS]),
        tags: getTags(group[0]),
    };
};

const getUniqueSlugs = (battles: { [slug: string]: NewBattle[] }): NewBattle[] => {
    const unique: NewBattle[] = [];

    for (let i = 0; i < Object.keys(battles).length; i++) {
        const slug: string = Object.keys(battles)[i];
        if (battles[slug].length === 1) {
            unique.push(battles[slug][0]);
        } else {
            battles[slug].forEach((battle: NewBattle, j: number) => {
                battle.slug += `-${j + 1}`;
                unique.push(battle);
            });
        }
    }

    return unique;
};

// ---------------------------------------------------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------------------------------------------------

export const parse = (game: string): NewBattle[] => {
    const rows: string[] = fs.readFileSync(`src/data/csvs/${game}.csv`).toString().split("\r\n");
    const battles: { [slug: string]: NewBattle[] } = {};

    let i: number = NUM_HEADERS;
    while (i < rows.length) {
        // Gather rows for next battle
        const nextBattle: [string[][], number] = getNextBattle(rows, i);
        const group: string[][] = nextBattle[0];
        i = nextBattle[1];

        // Compute slug for the battle
        const slug: string = getBattleSlug(game, group[0]);
        if (!battles[slug]) {
            battles[slug] = [];
        }

        // Build battle object and add it to the master object
        battles[slug].push(getBattle(slug, group));
    }

    // Number any battles with matching slugs
    return getUniqueSlugs(battles);
};
