import { BattleItems, BattleTags, PokemonSet } from "@prisma/client";

export default interface Battle {
    slug: string;
    name: string;
    location: string;
    team: PokemonSet[];
    items?: BattleItems;
    tags: BattleTags[];
    trainer: string;
}
