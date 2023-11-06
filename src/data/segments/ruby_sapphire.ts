import Split from "@/models/Split";

const ruby_sapphire: Split[] = [
    {
        name: "Roxanne",
        segments: [
            {
                slug: "littleroot-town",
                type: "location",
                areas: ["littleroot-town-area"],
                items: [],
                apiSlug: "littleroot-town",
            },
            {
                slug: "rival-1",
                name: "Rival 1",
                type: "battle",
                battles: ["rs-may-treecko-1"],
                items: [],
                conditions: {
                    character: "brendan",
                    game: null,
                    starter: "treecko",
                },
            },
        ],
    },
];

export default ruby_sapphire;
