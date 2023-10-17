import trainers from "@/data/trainers";
import prisma from "@/lib/prisma";
import Trainer from "@/models/Trainer";
import { TRAINERS } from "@/utils/constants";
import { clearCollection, logCreate, logFinish, logStart } from "@/utils/global";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

const handleCreateTrainer = async (trainer: Trainer, id: number): Promise<void> => {
    const slug: string = trainer.slug;
    logCreate(slug, id);

    await prisma.trainers.upsert({
        where: { slug: slug },
        update: trainer,
        create: trainer,
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createTrainers = async (clear: boolean, start: number): Promise<void> => {
    logStart(TRAINERS, start);
    clearCollection(TRAINERS, clear);

    for (let i = start; i <= trainers.length; i++) {
        await handleCreateTrainer(trainers[i - 1], i);
    }

    logFinish(TRAINERS);
};
