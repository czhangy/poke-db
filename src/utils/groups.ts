import splits from "@/data/maps/splits";
import prisma from "@/lib/prisma";
import Segment from "@/models/Segment";
import Split from "@/models/Split";
import { GROUPS } from "@/utils/constants";
import { clearCollection, getEnglishName, getError, logFinish, logProgress, logStart } from "@/utils/global";
import { Location, LocationClient } from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLERS
// ---------------------------------------------------------------------------------------------------------------------

const handleCreateSegment = async (
    segment: Segment,
    splitID: string,
    api: LocationClient,
    used: string[]
): Promise<void> => {
    let name: string;
    if (segment.name) {
        name = segment.name;
    } else if (segment.apiSlug) {
        const location: Location = await api.getLocationByName(segment.apiSlug);
        name = getEnglishName(location.names, segment.slug);
    } else {
        throw new Error(getError(segment.slug, "Missing name"));
    }

    if (used.includes(segment.slug)) {
        throw new Error(getError(segment.slug, "Duplicate slug"));
    } else {
        used.push(segment.slug);
    }

    await prisma.segments.create({
        data: {
            slug: segment.slug,
            name: name,
            type: segment.type,
            areas: [],
            battles: segment.battles
                ? {
                      connect: segment.battles.map((slug: string) => {
                          return { slug: slug };
                      }),
                  }
                : undefined,
            items:
                segment.items.length > 0
                    ? {
                          connect: segment.items.map((slug: string) => {
                              return { slug: slug };
                          }),
                      }
                    : undefined,
            conditions: segment.conditions ? segment.conditions : {},
            splitID: splitID,
        },
    });
};

const handleCreateSplit = async (
    split: Split,
    groupID: string,
    api: LocationClient,
    progress: { [count: string]: number },
    used: string[]
): Promise<void> => {
    const id: string = (await prisma.splits.create({ data: { name: split.name, groupID: groupID } })).id;

    for (const segment of split.segments) {
        await handleCreateSegment(segment, id, api, used);
        progress.count++;
        logProgress(progress.count, progress.total);
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createGroup = async (clear: boolean, group: string): Promise<void> => {
    logStart(GROUPS);
    await clearCollection(GROUPS, clear);

    await prisma.groups.delete({ where: { slug: group } });

    const id: string = (await prisma.groups.create({ data: { slug: group } })).id;
    const api: LocationClient = new LocationClient();
    const progress: { [key: string]: number } = {
        count: 0,
        total: splits[group].length + splits[group].map((split: Split) => split.segments).flat().length,
    };
    const used: string[] = [];

    for (const split of splits[group]) {
        await handleCreateSplit(split, id, api, progress, used);
        progress.count++;
        logProgress(progress.count, progress.total);
    }

    logFinish(GROUPS);
};
