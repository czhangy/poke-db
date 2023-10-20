import { createAbilities } from "@/utils/abilities";
import { createBattles } from "@/utils/battles";
import { ABILITIES, BATTLES, ITEMS, MOVES, POKEMON, TRAINERS } from "@/utils/constants";
import { logComplete } from "@/utils/global";
import { createItems } from "@/utils/items";
import { createMoves } from "@/utils/moves";
import { parse } from "@/utils/parse";
import { createPokemon } from "@/utils/pokemon";
import { createTrainers } from "@/utils/trainers";
import { NextApiRequest, NextApiResponse } from "next";

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

const CLEAR: string = "clear";
const UPDATE: string = "update";
const OK: number = 200;

// ---------------------------------------------------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    const modified: string[] = [];
    const warnings: { [warning: string]: string[] } = {};
    const clear: boolean = CLEAR in req.query;

    if (ABILITIES in req.query) {
        await createAbilities(clear, warnings);
        modified.push(ABILITIES);
    }

    if (BATTLES in req.query) {
        await createBattles(clear, parse(req.query.game as string));
        modified.push(BATTLES);
    }

    if (ITEMS in req.query) {
        await createItems(clear, warnings);
        modified.push(ITEMS);
    }

    if (MOVES in req.query) {
        await createMoves(clear, warnings);
        modified.push(MOVES);
    }

    if (POKEMON in req.query) {
        await createPokemon(
            clear,
            parseInt(req.query.pokemon_start as string),
            parseInt(req.query.pokemon_end as string),
            warnings
        );
        modified.push(POKEMON);
    }

    if (TRAINERS in req.query) {
        await createTrainers(clear);
        modified.push(TRAINERS);
    }

    if (modified.length > 0) {
        logComplete();
    }

    return res.status(OK).json({ mode: clear ? CLEAR : UPDATE, modified: modified, warnings: warnings });
}
