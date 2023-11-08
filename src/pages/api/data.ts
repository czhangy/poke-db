import { createAbilities } from "@/utils/abilities";
import { createBattles } from "@/utils/battles";
import { ABILITIES, BATTLES, GROUPS, ITEMS, LOCATIONS, MOVES, POKEMON, STATIC } from "@/utils/constants";
import { logComplete } from "@/utils/global";
import { createGroup } from "@/utils/groups";
import { createItems } from "@/utils/items";
import { createLocations } from "@/utils/locations";
import { createMoves } from "@/utils/moves";
import { createPokemon } from "@/utils/pokemon";
import { createStaticInfo } from "@/utils/static";
import { NextApiRequest, NextApiResponse } from "next";

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

const CLEAR: string = "clear";
const UPDATE: string = "update";
const OK: number = 200;
const INTERNAL_SERVER_ERROR: number = 500;

// ---------------------------------------------------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    try {
        const modified: string[] = [];
        const warnings: { [warning: string]: string[] } = {};
        const clear: boolean = CLEAR in req.query;

        if (ABILITIES in req.query) {
            await createAbilities(clear, warnings);
            modified.push(ABILITIES);
        }

        if (BATTLES in req.query) {
            await createBattles(clear, req.query.battles_group as string);
            modified.push(BATTLES);
        }

        if (GROUPS in req.query) {
            await createGroup(clear, req.query.groups_group as string);
            modified.push(GROUPS);
        }

        if (ITEMS in req.query) {
            await createItems(clear, warnings);
            modified.push(ITEMS);
        }

        if (LOCATIONS in req.query) {
            await createLocations(clear, req.query.locations_group as string, warnings);
            modified.push(LOCATIONS);
        }

        if (MOVES in req.query) {
            await createMoves(clear, warnings);
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

        if (STATIC in req.query) {
            await createStaticInfo(clear);
            modified.push(STATIC);
        }

        if (modified.length > 0) {
            logComplete();
        }

        return res.status(OK).json({ mode: clear ? CLEAR : UPDATE, modified: modified, warnings: warnings });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
}
