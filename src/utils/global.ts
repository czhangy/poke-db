import groups from "@/data/groups";
import prisma from "@/lib/prisma";
import { BEGIN, DEFAULT, ENGLISH, ERROR, FETCH_LIMIT, ID_BREAKPOINT, ID_IDX, RESET, SUCCESS } from "@/utils/constants";
import { Description } from "@prisma/client";
import { AbilityFlavorText, MoveFlavorText, Name, NamedAPIResource, VersionGroupFlavorText } from "pokenode-ts";

// Removes adjacent duplicates from array
export const removeDuplicates = (arr: { [key: string]: any }[], property: string): any[] => {
    return arr.filter(
        (obj: { [key: string]: any }, i: number) =>
            JSON.stringify(arr[i - 1][property]) !== JSON.stringify(obj[property])
    );
};

// Removes "\n" characters from a string
export const removeNewlines = (str: string): string => {
    return str.replaceAll("\n", " ");
};

// Extracts the English name out of a names array
export const getEnglishName = (names: Name[]): string => {
    return names.find((name) => name.language.name === ENGLISH)!.name;
};

// Get list of descriptions for an ability/move/item
export const getDescriptions = (
    fte: AbilityFlavorText[] | MoveFlavorText[] | VersionGroupFlavorText[],
    name: string
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
        logError("descriptions", name);
        return [];
    }

    descriptions[0].group = DEFAULT;
    return removeDuplicates(descriptions, "desc");
};

// Fetch data from PokeAPI page-by-page
export const fetchByPage = async <T>(
    apiClient: T,
    start: number,
    max: number,
    list: string,
    handler: (apiClient: T, id: number) => Promise<void>
): Promise<void> => {
    for (let i = start; i < max; i += FETCH_LIMIT) {
        // @ts-expect-error
        const arr: NamedAPIResource[] = (await apiClient[list](i, FETCH_LIMIT)).results.filter(
            (result: NamedAPIResource) => parseInt(result.url.split("/").at(ID_IDX) as string) < ID_BREAKPOINT
        );

        for (let j = i; j < i + arr.length; j++) {
            await handler(apiClient, j + 1);
        }
    }
};

// Formatted log for creation
export const logCreate = (slug: string, id?: number): void => {
    console.log(`${BEGIN}Creating${id === undefined ? "" : ` [${id}]`} ${slug}${RESET}...`);
};

// Formatted log for update start
export const logStart = (collection: string, start?: number, end?: number): void => {
    console.log(
        `${BEGIN}Updating ${collection} collection${start === undefined ? "" : ` from #${start}`}${
            end === undefined ? "" : ` to #${end}`
        }...${RESET}`
    );
};

// Formatted log for update finish
export const logFinish = (collection: string): void => {
    `${SUCCESS}${collection[0].toUpperCase() + collection.substring(1)} collection updated!${RESET}`;
};

// Formatted log for errors
export const logError = (target: string, slug: string): void => {
    console.log(`${ERROR}Error when finding ${target} for ${slug}${RESET}`);
};

// Clears a specified collection of all data if requested
export const clearCollection = async (collection: string, clear: boolean) => {
    if (clear) {
        // @ts-expect-error
        await prisma[collection].deleteMany({});
    }
};
