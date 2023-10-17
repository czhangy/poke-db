import usedItems from "@/data/used_items";
import prisma from "@/lib/prisma";
import { ENGLISH, ITEMS } from "@/utils/constants";
import { clearCollection, getDescriptions, getEnglishName, logCreate, logFinish, logStart } from "@/utils/global";
import { Items } from "@prisma/client";
import { Item, ItemClient, VersionGroupFlavorText } from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLER
// ---------------------------------------------------------------------------------------------------------------------

type NewItem = Omit<Items, "id">;

const handleCreateItem = async (itemAPI: ItemClient, slug: string): Promise<void> => {
    const item: Item = await itemAPI.getItemByName(slug);
    logCreate(slug);

    const newItem: NewItem = {
        slug: slug,
        name: getEnglishName(item.names),
        sprite: item.sprites.default,
        desc: getDescriptions(
            item.flavor_text_entries.filter((vgft: VersionGroupFlavorText) => vgft.language.name === ENGLISH),
            item.name
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

export const createItems = async (clear: boolean): Promise<void> => {
    logStart(ITEMS);
    clearCollection(ITEMS, clear);

    const itemAPI: ItemClient = new ItemClient();
    for (const item of usedItems) {
        await handleCreateItem(itemAPI, item);
    }

    logFinish(ITEMS);
};
