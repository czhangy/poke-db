import groups from "@/data/groups";
import prisma from "@/lib/prisma";
import { DEFAULT, ENGLISH } from "@/utils/constants";
import { Description } from "@prisma/client";
import { AbilityFlavorText, MoveFlavorText, Name, NamedAPIResource, VersionGroupFlavorText } from "pokenode-ts";

// ---------------------------------------------------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------------------------------------------------

const RESET: string = "\x1b[0m";
const SUCCESS: string = "\x1b[32m";
const BEGIN: string = "\x1b[33m";
const FOCUS: string = "\x1b[35m";
const FETCH_LIMIT: number = 100;
const ID_IDX: number = -2;
const ID_BREAKPOINT: number = 10000;

// ---------------------------------------------------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------------------------------------------------

// Removes "\n" characters from a string
const removeNewlines = (str: string): string => {
    return str.replaceAll("\n", " ");
};

// Removes adjacent duplicates from array
export const removeDuplicates = (arr: { [key: string]: any }[], property: string): any[] => {
    return arr.filter((obj: { [key: string]: any }, i: number) => {
        if (i > 0) {
            return JSON.stringify(arr[i - 1][property]) !== JSON.stringify(obj[property]);
        } else {
            return true;
        }
    });
};

// Extracts the English name out of a names array
export const getEnglishName = (names: Name[], slug: string, warnings: { [warning: string]: string[] }): string => {
    const name: Name | undefined = names.find((name: Name) => name.language.name === ENGLISH);
    if (name) {
        return name.name;
    } else {
        if (!warnings.missing_name) {
            warnings.missing_name = [];
        }
        warnings.missing_name.push(slug);
        return slug;
    }
};

// Get list of descriptions for an ability/move/item
export const getDescriptions = (
    fte: AbilityFlavorText[] | MoveFlavorText[] | VersionGroupFlavorText[],
    name: string,
    warnings: { [warning: string]: string[] }
): Description[] => {
    const descriptions: Description[] = fte
        .map((ft: AbilityFlavorText | MoveFlavorText | VersionGroupFlavorText) => {
            const text: string = "flavor_text" in ft ? ft.flavor_text : ft.text;
            return {
                desc: removeNewlines(text),
                group: groups.indexOf(ft.version_group.name),
            };
        })
        .sort((a: Description, b: Description) => a.group - b.group);

    if (descriptions.length === 0) {
        if (!warnings.missing_descriptions) {
            warnings.missing_descriptions = [];
        }
        warnings.missing_descriptions.push(name);
        return [];
    }

    descriptions[0].group = DEFAULT;
    return removeDuplicates(descriptions, "desc");
};

// Fetch data from PokeAPI page-by-page
export const fetchByPage = async <T>(
    apiClient: T,
    max: number,
    list: string,
    handler: (apiClient: T, id: number, warnings: { [warning: string]: string[] }) => Promise<void>,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    let progress: number = 0;

    for (let i = 0; i < max; i += FETCH_LIMIT) {
        // @ts-expect-error
        const arr: NamedAPIResource[] = (await apiClient[list](i, FETCH_LIMIT)).results.filter(
            (result: NamedAPIResource) => parseInt(result.url.split("/").at(ID_IDX) as string) < ID_BREAKPOINT
        );

        if (arr.length < Math.min(FETCH_LIMIT, max - i)) {
            progress += Math.min(FETCH_LIMIT, max - i) - arr.length;
        }

        const promises: Promise<void>[] = [];
        for (let j = i; j < i + arr.length; j++) {
            promises.push(
                handler(apiClient, j + 1, warnings).then(() => {
                    progress++;
                    logProgress(progress, max);
                })
            );
        }
        await Promise.all(promises);
    }
};

// Formatted log for collection update start
export const logStart = (collection: string, start?: number, end?: number): void => {
    console.log(
        `${BEGIN}Updating ${collection} collection${start === undefined ? "" : ` from #${start}`}${
            end === undefined ? "" : ` to #${end}`
        }...${RESET}`
    );
    console.log(`${FOCUS}Preparing...${RESET}`);
};

// Formatted log for collection update finish
export const logFinish = (collection: string): void => {
    `${SUCCESS}${collection[0].toUpperCase() + collection.substring(1)} collection updated!${RESET}`;
};

// Log for update complete
export const logComplete = (): void => {
    console.log(`${SUCCESS}DB update complete!${RESET}`);
};

// Formatted log for progress
export const logProgress = (done: number, total: number): void => {
    const MAX_SEGMENTS: number = 20;

    const progress: number = Math.round((done / total) * 100);
    const segments = Math.floor(progress / (100 / MAX_SEGMENTS));
    const percentage: string = `${String(progress)}%`.padEnd(5);

    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine(1);
    console.log(`${FOCUS}${percentage}[${"=".repeat(segments)}${" ".repeat(MAX_SEGMENTS - segments)}]${RESET}`);
};

// Clears a specified collection of all data if requested
export const clearCollection = async (collection: string, clear: boolean) => {
    if (clear) {
        // @ts-expect-error
        await prisma[collection].deleteMany({});
    }
};
