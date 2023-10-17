import { createAbilities } from "@/utils/abilities";
import { ABILITIES, CLEAR, ITEMS, MOVES, OK, POKEMON, RESET, SUCCESS, TRAINERS, UPDATE } from "@/utils/constants";
import { createItems } from "@/utils/items";
import { createMoves } from "@/utils/moves";
import { createPokemon } from "@/utils/pokemon";
import { createTrainers } from "@/utils/trainers";
import { NextApiRequest, NextApiResponse } from "next";

// ---------------------------------------------------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    const modified: string[] = [];
    const clear: boolean = CLEAR in req.query;

    if (ABILITIES in req.query) {
        await createAbilities(clear, parseInt(req.query.abilities_start as string));
        modified.push(ABILITIES);
    }

    if (ITEMS in req.query) {
        await createItems(clear);
        modified.push(ITEMS);
    }

    if (MOVES in req.query) {
        await createMoves(clear, parseInt(req.query.moves_start as string));
        modified.push(MOVES);
    }

    if (POKEMON in req.query) {
        await createPokemon(
            clear,
            parseInt(req.query.pokemon_start as string),
            parseInt(req.query.pokemon_end as string)
        );
        modified.push(POKEMON);
    }

    if (TRAINERS in req.query) {
        await createTrainers(clear, parseInt(req.query.trainers_start as string));
        modified.push(TRAINERS);
    }

    if (modified.length > 0) {
        console.log(`${SUCCESS}DB update complete!${RESET}`);
    }

    return res.status(OK).json({ mode: clear ? CLEAR : UPDATE, modified: modified });
}
