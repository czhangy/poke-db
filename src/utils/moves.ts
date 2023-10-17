import groups from "@/data/groups";
import prisma from "@/lib/prisma";
import { DEFAULT, ENGLISH, MOVES, PHYSICAL, SPECIAL } from "@/utils/constants";
import {
    clearCollection,
    fetchByPage,
    getDescriptions,
    getEnglishName,
    logCreate,
    logError,
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
        logError("damage class", move.name);
        return [];
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
        class: move.damage_class!.name as "physical" | "special" | "status",
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

    for (const pastValue of move.past_values) {
        if (pastValue.pp) {
            pp.push({ num: pastValue.pp, group: currentGroup });
            currentGroup = groups.indexOf(pastValue.version_group.name);
        }
    }

    if (!move.pp) {
        logError("PP", move.name);
        return [];
    }

    pp.push({ num: move.pp!, group: currentGroup });

    return pp;
};

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

type NewMove = Omit<Moves, "id">;

const handleCreateMove = async (moveAPI: MoveClient, id: number): Promise<void> => {
    const move: Move = await moveAPI.getMoveById(id);
    const slug: string = move.name;

    logCreate(slug, id);

    const newMove: NewMove = {
        slug: slug,
        name: getEnglishName(move.names),
        type: getTypes(move),
        class: getClass(move),
        bp: getBP(move),
        pp: getPP(move),
        desc: getDescriptions(
            move.flavor_text_entries.filter((mft: MoveFlavorText) => mft.language.name === ENGLISH),
            move.name
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

export const createMoves = async (clear: boolean, start: number): Promise<void> => {
    logStart(MOVES, start);
    clearCollection(MOVES, clear);

    const moveAPI: MoveClient = new MoveClient();
    const count: number = (await moveAPI.listMoves()).count;
    fetchByPage(moveAPI, start - 1, count, "listMoves", handleCreateMove);

    logFinish(MOVES);
};
