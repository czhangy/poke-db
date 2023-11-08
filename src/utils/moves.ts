import groups from "@/data/lists/groups";
import prisma from "@/lib/prisma";
import { DEFAULT, ENGLISH, MOVES } from "@/utils/constants";
import {
    clearCollection,
    fetchByPage,
    getDescriptions,
    getEnglishName,
    getError,
    logFinish,
    logStart,
} from "@/utils/global";
import { MoveClass, MoveNum, MoveType, Moves } from "@prisma/client";
import { Move, MoveClient, MoveFlavorText } from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

const GEN_4_IDX: number = 3;
const PHYSICAL_TYPES: string[] = ["normal", "fighting", "poison", "ground", "flying", "bug", "rock", "ghost", "steel"];
const PRE_SPLIT_GENS: string[] = ["generation-i", "generation-ii", "generation-iii"];
const PHYSICAL: "physical" = "physical";
const SPECIAL: "special" = "special";

// ---------------------------------------------------------------------------------------------------------------------
// PROPERTIES
// ---------------------------------------------------------------------------------------------------------------------

const getTypes = (move: Move): MoveType[] => {
    const types: MoveType[] = [];
    let currentGroup = DEFAULT;

    // Add past types
    for (const pastValue of move.past_values) {
        if (pastValue.type) {
            types.push({ type: pastValue.type.name, group: currentGroup });
            currentGroup = groups.indexOf(pastValue.version_group.name);
        }
    }

    // Add most recent type
    types.push({ type: move.type.name, group: currentGroup });

    return types;
};

const getClass = (move: Move): MoveClass[] => {
    const classes: MoveClass[] = [];
    let currentGroup = DEFAULT;

    if (!move.damage_class) {
        throw new Error(getError(move.name, "Missing damage class"));
    }

    // Add pre-split class if the move is Gen III or earlier
    if (PRE_SPLIT_GENS.includes(move.generation.name)) {
        if (move.damage_class.name === PHYSICAL && !PHYSICAL_TYPES.includes(move.type.name)) {
            classes.push({ class: SPECIAL, group: DEFAULT });
            currentGroup = GEN_4_IDX;
        } else if (move.damage_class.name === SPECIAL && PHYSICAL_TYPES.includes(move.type.name)) {
            classes.push({ class: PHYSICAL, group: DEFAULT });
            currentGroup = GEN_4_IDX;
        }
    }

    classes.push({
        class: move.damage_class.name as "physical" | "special" | "status",
        group: currentGroup,
    });

    return classes;
};

const getBP = (move: Move): MoveNum[] => {
    const bp: MoveNum[] = [];
    let currentGroup: number = DEFAULT;

    for (const pastValue of move.past_values) {
        if (pastValue.power) {
            bp.push({ num: pastValue.power, group: currentGroup });
            currentGroup = groups.indexOf(pastValue.version_group.name);
        }
    }

    bp.push({ num: move.power ? move.power : 0, group: currentGroup });

    return bp;
};

const getPP = (move: Move): MoveNum[] => {
    const pp: MoveNum[] = [];
    let currentGroup: number = DEFAULT;

    if (!move.pp) {
        throw new Error(getError(move.name, "Missing PP value"));
    }

    for (const pastValue of move.past_values) {
        if (pastValue.pp) {
            pp.push({ num: pastValue.pp, group: currentGroup });
            currentGroup = groups.indexOf(pastValue.version_group.name);
        }
    }

    pp.push({ num: move.pp, group: currentGroup });

    return pp;
};

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

type NewMove = Omit<Moves, "id">;

const handleCreateMove = async (
    moveAPI: MoveClient,
    id: number,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    const move: Move = await moveAPI.getMoveById(id);
    const slug: string = move.name;

    const newMove: NewMove = {
        slug: slug,
        name: getEnglishName(move.names, slug),
        type: getTypes(move),
        class: getClass(move),
        bp: getBP(move),
        pp: getPP(move),
        desc: getDescriptions(
            move.flavor_text_entries.filter((mft: MoveFlavorText) => mft.language.name === ENGLISH),
            move.name,
            warnings
        ),
    };

    await prisma.moves.upsert({
        where: { slug: slug },
        update: newMove,
        create: newMove,
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createMoves = async (clear: boolean, warnings: { [warning: string]: string[] }): Promise<void> => {
    logStart(MOVES);
    await clearCollection(MOVES, clear);

    const moveAPI: MoveClient = new MoveClient();
    const count: number = (await moveAPI.listMoves()).count;
    await fetchByPage(moveAPI, count, "listMoves", handleCreateMove, warnings);

    logFinish(MOVES);
};
