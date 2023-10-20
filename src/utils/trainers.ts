import trainers from "@/data/trainers";
import prisma from "@/lib/prisma";
import Trainer from "@/models/Trainer";
import { TRAINERS } from "@/utils/constants";
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

export const createTrainers = async (clear: boolean): Promise<void> => {
    logStart(TRAINERS);
    await clearCollection(TRAINERS, clear);

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

    logFinish(TRAINERS);
};
