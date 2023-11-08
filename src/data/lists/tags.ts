import Tag from "@/models/Tag";
import { DOUBLE, REQUIRED } from "@/utils/constants";

const tags: Tag[] = [
    {
        slug: DOUBLE,
        name: "Double Battle",
        title: "This is a double battle",
        color: "#4567ff",
    },
    {
        slug: REQUIRED,
        name: "Required",
        title: "This is a required battle",
        color: "#c40101",
    },
];

export default tags;
