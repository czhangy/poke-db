import { SegmentConditions } from "@prisma/client";

export default interface Segment {
    slug: string;
    name?: string;
    type: "battle" | "location";
    areas?: string[];
    battles?: string[];
    items: string[];
    conditions?: SegmentConditions;
    apiSlug?: string;
}
