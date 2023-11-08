import prisma from "@/lib/prisma";
import Battle from "@/models/Battle";
import { BATTLES } from "@/utils/constants";
import { clearCollection, logFinish, logProgress, logStart } from "@/utils/global";
import { parse } from "@/utils/parse";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

const handleCreateBattle = async (battle: Battle): Promise<void> => {
    await prisma.battles.create({
        data: {
            ...battle,
            item: battle.item ? { connect: { slug: battle.item } } : undefined,
            tags: {
                connect: battle.tags.map((tag: string) => {
                    return { slug: tag };
                }),
            },
            trainer: {
                connect: { slug: battle.trainer },
            },
        },
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
    const total = battles.length;

    for (const battle of battles) {
        if (battle.tags.length > 0) {
            await handleCreateBattle(battle);
            progress++;
            logProgress(progress, total);
        } else {
            promises.push(
                handleCreateBattle(battle).then(() => {
                    progress++;
                    logProgress(progress, total);
                })
            );
        }
    }

    await Promise.all(promises);

    logFinish(BATTLES);
};
