import { LOCATIONS } from "@/utils/constants";
import { clearCollection, logFinish, logStart } from "@/utils/global";

// ---------------------------------------------------------------------------------------------------------------------
// API CALLERS
// ---------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------------
// CONTROLLER
// ---------------------------------------------------------------------------------------------------------------------

export const createLocations = async (
    clear: boolean,
    group: string,
    warnings: { [warning: string]: string[] }
): Promise<void> => {
    logStart(LOCATIONS);
    await clearCollection(LOCATIONS, clear);

    logFinish(LOCATIONS);
};
