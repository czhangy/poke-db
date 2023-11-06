import splits from "@/data/maps/splits";
import prisma from "@/lib/prisma";
import Segment from "@/models/Segment";
import Split from "@/models/Split";
import { GROUPS } from "@/utils/constants";
import { clearCollection, getEnglishName, logFinish, logProgress, logStart } from "@/utils/global";
import { Location, LocationClient } from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLERS
// ---------------------------------------------------------------------------------------------------------------------

const handleCreateSegment = async (
    segment: Segment,
    splitID: string,
    api: LocationClient,
    used: string[],
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    let name: string;
    if (segment.name) {
        name = segment.name;
    } else if (segment.apiSlug) {
        const location: Location = await api.getLocationByName(segment.apiSlug);
        name = getEnglishName(location.names, segment.slug, warnings);
    } else {
        if (!warnings.missing_name) {
            warnings.missing_name = [];
        }
        warnings.missing_name.push(segment.slug);
        return;
    }

    if (used.includes(segment.slug)) {
        if (!warnings.duplicate_slug) {
            warnings.duplicate_slug = [];
        }
        warnings.duplicate_slug.push(segment.slug);
        return;
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
    used: string[],
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    const id: string = (await prisma.splits.create({ data: { name: split.name, groupID: groupID } })).id;

    const promises: Promise<void>[] = [];
    for (const segment of split.segments) {
        promises.push(
            handleCreateSegment(segment, id, api, used, warnings).then(() => {
                progress.count++;
                logProgress(progress.count, progress.total);
            })
        );
    }
    await Promise.all(promises);
};

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createGroup = async (
    clear: boolean,
    group: string,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    logStart(GROUPS);
    await clearCollection(GROUPS, clear);

    await prisma.groups.delete({ where: { slug: group } });
    await prisma.segments.deleteMany({});

    const id: string = (await prisma.groups.create({ data: { slug: group } })).id;
    const api: LocationClient = new LocationClient();
    const progress: { [key: string]: number } = {
        count: 0,
        total: splits[group].map((split: Split) => split.segments).flat().length,
    };
    const used: string[] = [];

    await Promise.all(splits[group].map((split: Split) => handleCreateSplit(split, id, api, progress, used, warnings)));

    logFinish(GROUPS);
};
