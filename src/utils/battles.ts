import prisma from "@/lib/prisma";
import { BATTLES } from "@/utils/constants";
import { clearCollection, logFinish, logProgress, logStart } from "@/utils/global";
import { Battles } from "@prisma/client";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

type NewBattle = Omit<Battles, "id">;

const handleCreateBattle = async (battle: NewBattle): Promise<void> => {
    const slug: string = battle.slug;

    await prisma.battles.upsert({
        where: { slug: slug },
        update: battle,
        create: battle,
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createBattles = async (clear: boolean, battles: NewBattle[]): Promise<void> => {
    logStart(BATTLES);
    clearCollection(BATTLES, clear);

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
