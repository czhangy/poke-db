import tags from "@/data/lists/tags";
import trainers from "@/data/lists/trainers";
import prisma from "@/lib/prisma";
import Tag from "@/models/Tag";
import Trainer from "@/models/Trainer";
import { STATIC } from "@/utils/constants";
import { clearCollection, logFinish, logProgress, logStart } from "@/utils/global";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

const handleCreateTag = async (tag: Tag): Promise<void> => {
    await prisma.tags.upsert({
        where: { slug: tag.slug },
        update: tag,
        create: tag,
    });
};

const handleCreateTrainer = async (trainer: Trainer): Promise<void> => {
    await prisma.trainers.upsert({
        where: { slug: trainer.slug },
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
    const total: number = tags.length + trainers.length;

    tags.forEach((tag: Tag) =>
        promises.push(
            handleCreateTag(tag).then(() => {
                progress++;
                logProgress(progress, total);
            })
        )
    );

    trainers.forEach((trainer: Trainer) =>
        promises.push(
            handleCreateTrainer(trainer).then(() => {
                progress++;
                logProgress(progress, total);
            })
        )
    );

    await Promise.all(promises);

    logFinish(STATIC);
};
