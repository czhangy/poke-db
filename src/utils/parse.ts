import Battle from "@/models/Battle";
import { DOUBLE as DOUBLE_TAG, REQUIRED as REQUIRED_TAG } from "@/utils/constants";
import { PokemonSet } from "@prisma/client";

const fs = require("fs");

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

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

const GAME_PREFIXES: { [group: string]: string } = {
    ruby_sapphire: "rs",
    emerald: "emerald",
};

// ---------------------------------------------------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------------------------------------------------

const toSlug = (name: string): string => {
    return name.replace(/[\s_]/g, "-").replace(/[.'~]/g, "").toLowerCase();
};

const getName = (name: string): string => {
    const condition: number = name.indexOf("{");
    return condition === -1 ? name : name.substring(0, condition - 1);
};

const getTeam = (battle: string[][]): PokemonSet[] => {
    const sets: PokemonSet[] = [];

    battle.forEach((row: string[]) => {
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

const getItems = (items: string): [string | undefined, number] => {
    return items
        ? [toSlug(items.substring(items.indexOf(" ") + 1)), parseInt(items.substring(1, items.indexOf("]")))]
        : [undefined, 0];
};

const getTags = (row: string[]): string[] => {
    const tags: string[] = [];
    if (row[DOUBLE]) {
        tags.push(DOUBLE_TAG);
    }
    if (row[REQUIRED]) {
        tags.push(REQUIRED_TAG);
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

const getBattleSlug = (group: string, battle: string[]): string => {
    // Extract and process components
    const prefix: string = GAME_PREFIXES[group];

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

const getBattle = (slug: string, battle: string[][]): Battle => {
    const [item, itemCount]: [string | undefined, number] = getItems(battle[0][ITEMS]);

    return {
        slug: slug,
        name: getName(battle[0][NAME]),
        location: battle[0][LOCATION],
        team: getTeam(battle),
        item: item ? item : undefined,
        itemCount: itemCount,
        tags: getTags(battle[0]),
        trainer: toSlug(battle[0][TRAINER]),
    };
};

const getUniqueSlugs = (battles: { [slug: string]: Battle[] }): Battle[] => {
    const unique: Battle[] = [];

    for (let i = 0; i < Object.keys(battles).length; i++) {
        const slug: string = Object.keys(battles)[i];
        if (battles[slug].length === 1) {
            unique.push(battles[slug][0]);
        } else {
            battles[slug].forEach((battle: Battle, j: number) => {
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

export const parse = (group: string): Battle[] => {
    const rows: string[] = fs.readFileSync(`src/data/csvs/${group}.csv`).toString().split("\r\n");
    const battles: { [slug: string]: Battle[] } = {};

    let i: number = NUM_HEADERS;
    while (i < rows.length) {
        // Gather rows for next battle
        const nextBattle: [string[][], number] = getNextBattle(rows, i);
        const battle: string[][] = nextBattle[0];
        i = nextBattle[1];

        // Compute slug for the battle
        const slug: string = getBattleSlug(group, battle[0]);
        if (!battles[slug]) {
            battles[slug] = [];
        }

        // Build battle object and add it to the master object
        battles[slug].push(getBattle(slug, battle));
    }

    // Number any battles with matching slugs
    return getUniqueSlugs(battles);
};
