import trainers from "@/data/lists/trainers";
import prisma from "@/lib/prisma";
import Trainer from "@/models/Trainer";
import { STATIC } from "@/utils/constants";
import { clearCollection, logFinish, logProgress, logStart } from "@/utils/global";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

const handleCreateTrainer = async (trainer: Trainer): Promise<void> => {
    const slug: string = trainer.slug;

    await prisma.trainers.upsert({
        where: { slug: slug },
        update: trainer,
        create: trainer,
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createStaticInfo = async (clear: boolean): Promise<void> => {
    logStart(STATIC);
    await clearCollection(STATIC, clear);

    const promises: Promise<void>[] = [];
    let progress: number = 0;
    for (const trainer of trainers) {
        promises.push(
            handleCreateTrainer(trainer).then(() => {
                progress++;
                logProgress(progress, trainers.length);
            })
        );
    }
    await Promise.all(promises);

    logFinish(STATIC);
};
