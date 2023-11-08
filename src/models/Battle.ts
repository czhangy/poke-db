import { PokemonSet } from "@prisma/client";

export default interface Battle {
    slug: string;
    name: string;
    location: string;
    team: PokemonSet[];
    item: string | undefined;
    itemCount: number;
    tags: string[];
    trainer: string;
}
