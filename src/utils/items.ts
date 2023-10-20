import usedItems from "@/data/used_items";
import prisma from "@/lib/prisma";
import { ENGLISH, ITEMS } from "@/utils/constants";
import { clearCollection, getDescriptions, getEnglishName, logFinish, logProgress, logStart } from "@/utils/global";
import { Items } from "@prisma/client";
import { Item, ItemClient, VersionGroupFlavorText } from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

type NewItem = Omit<Items, "id">;

const handleCreateItem = async (
    itemAPI: ItemClient,
    slug: string,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    const item: Item = await itemAPI.getItemByName(slug);

    const newItem: NewItem = {
        slug: slug,
        name: getEnglishName(item.names, slug, warnings),
        sprite: item.sprites.default,
        desc: getDescriptions(
            item.flavor_text_entries.filter((vgft: VersionGroupFlavorText) => vgft.language.name === ENGLISH),
            item.name,
            warnings
        ),
    };

    await prisma.items.upsert({
        where: { slug: slug },
        update: newItem,
        create: newItem,
    });
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createItems = async (clear: boolean, warnings: { [warning: string]: string[] }): Promise<void> => {
    logStart(ITEMS);
    clearCollection(ITEMS, clear);

    const itemAPI: ItemClient = new ItemClient();

    const promises: Promise<void>[] = [];
    let progress: number = 0;
    for (const item of usedItems) {
        promises.push(
            handleCreateItem(itemAPI, item, warnings).then(() => {
                progress++;
                logProgress(progress, usedItems.length);
            })
        );
    }
    await Promise.all(promises);

    logFinish(ITEMS);
};
