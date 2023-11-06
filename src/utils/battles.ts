import prisma from "@/lib/prisma";
import Battle from "@/models/Battle";
import { BATTLES } from "@/utils/constants";
import { clearCollection, logFinish, logProgress, logStart } from "@/utils/global";
import { parse } from "@/utils/parse";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

const handleCreateBattle = async (battle: Battle): Promise<void> => {
    const slug: string = battle.slug;

    const newBattle = {
        ...battle,
        trainer: {
            connect: { slug: battle.trainer },
        },
    };

    await prisma.battles.upsert({
        where: { slug: slug },
        update: newBattle,
        create: newBattle,
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createBattles = async (clear: boolean, group: string): Promise<void> => {
    logStart(BATTLES);
    await clearCollection(BATTLES, clear);

    const battles: Battle[] = parse(group);

    const promises: Promise<void>[] = [];
    let progress: number = 0;
    for (const battle of battles) {
        promises.push(
            handleCreateBattle(battle).then(() => {
                progress++;
                logProgress(progress, battles.length);
            })
        );
    }
    await Promise.all(promises);

    logFinish(BATTLES);
};
