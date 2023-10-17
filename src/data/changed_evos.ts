// Format is [POKEMON]#[EVO_MODE]
const changedEvos: {
    [pokemon: string]: [string[] | undefined, string[] | undefined];
} = {
    "rattata-alola": [undefined, ["raticate-alola"]],
    "raticate-alola": [["rattata-alola"], undefined],
    pikachu: [["pichu"], ["raichu", "raichu-alola"]],
    "sandshrew-alola": [undefined, ["sandslash-alola"]],
    "sandslash-alola": [["sandshrew-alola"], undefined],
    "vulpix-alola": [undefined, ["ninetales-alola"]],
    "ninetales-alola": [["vulpix-alola"], undefined],
    "diglett-alola": [undefined, ["dugtrio-alola"]],
    "dugtrio-alola": [["diglett-alola"], undefined],
    meowth: [undefined, ["persian"]],
    "meowth-alola": [undefined, ["persian-alola"]],
    "meowth-galar": [undefined, ["perrserker"]],
    "persian-alola": [["meowth-alola"], undefined],
    "growlithe-hisui": [undefined, ["arcanine-hisui"]],
    "arcanine-hisui": [["growlithe-hisui"], undefined],
    "geodude-alola": [undefined, ["graveler-alola"]],
    "graveler-alola": [["geodude-alola"], ["golem-alola"]],
    "golem-alola": [["graveler-alola"], undefined],
    "ponyta-galar": [undefined, ["rapidash-galar"]],
    "rapidash-galar": [["ponyta-galar"], undefined],
    "slowpoke-galar": [undefined, ["slowbro-galar", "slowking-galar"]],
    "slowbro-galar": [["slowpoke-galar"], undefined],
    farfetchd: [undefined, undefined],
    "farfetchd-galar": [undefined, ["sirfetchd"]],
    "grimer-alola": [undefined, ["muk-alola"]],
    "muk-alola": [["grimer-alola"], undefined],
    "voltorb-hisui": [undefined, ["electrode-hisui"]],
    "electrode-hisui": [["voltorb-hisui"], undefined],
    exeggcute: [undefined, ["exeggutor", "exeggutor-alola"]],
    cubone: [undefined, ["marowak", "marowak-alola"]],
    koffing: [undefined, ["weezing", "weezing-galar"]],
    "mr-mime": [["mime-jr"], undefined],
    "mr-mime-galar": [["mime-jr"], ["mr-rime"]],
    quilava: [["cyndaquil"], ["typhlosion", "typhlosion-hisui"]],
    wooper: [undefined, ["quagsire"]],
    "wooper-paldea": [undefined, ["clodsire"]],
    quagsire: [["wooper"], undefined],
    "slowking-galar": [["slowpoke-galar"], undefined],
    qwilfish: [undefined, undefined],
    sneasel: [undefined, ["weavile"]],
    "sneasel-hisui": [undefined, ["sneasler"]],
    corsola: [undefined, undefined],
    "zigzagoon-galar": [undefined, ["linoone-galar"]],
    linoone: [["zigzagoon"], undefined],
    "linoone-galar": [["zigzagoon-galar"], ["obstagoon"]],
    "burmy-plant": [undefined, ["wormadam-plant", "mothim"]],
    "burmy-sandy": [undefined, ["wormadam-sandy", "mothim"]],
    "burmy-trash": [undefined, ["wormadam-trash", "mothim"]],
    "wormadam-plant": [["burmy-plant"], undefined],
    "wormadam-sandy": [["burmy-sandy"], undefined],
    "wormadam-trash": [["burmy-trash"], undefined],
    mothim: [["burmy-plant", "burmy-sandy", "burmy-trash"], undefined],
    "mime-jr": [undefined, ["mr-mime", "mr-mime-galar"]],
    dewott: [["oshawott"], ["samurott", "samurott-hisui"]],
    petilil: [undefined, ["lilligant", "lilligant-hisui"]],
    "darumaka-galar": [undefined, ["darmanitan-galar"]],
    "darmanitan-galar": [["darumaka-galar"], undefined],
    yamask: [undefined, ["cofagrigus"]],
    "yamask-galar": [undefined, ["runerigus"]],
    "zorua-hisui": [undefined, ["zoroark-hisui"]],
    "zoroark-hisui": [["zorua-hisui"], undefined],
    rufflet: [undefined, ["braviary", "braviary-hisui"]],
    goomy: [undefined, ["sliggoo", "sliggoo-hisui"]],
    "sliggoo-hisui": [["goomy"], ["goodra-hisui"]],
    "goodra-hisui": [["sliggoo-hisui"], undefined],
    bergmite: [undefined, ["avalugg", "avalugg-hisui"]],
    dartrix: [["rowlet"], ["decidueye", "decidueye-hisui"]],
    obstagoon: [["linoone-galar"], undefined],
    perrserker: [["meowth-galar"], undefined],
    cursola: [["corsola-galar"], undefined],
    sirfetchd: [["farfetchd-galar"], undefined],
    "mr-rime": [["mr-mime-galar"], undefined],
    runerigus: [["yamask-galar"], undefined],
    sneasler: [["sneasel-hisui"], undefined],
    overqwil: [["qwilfish-hisui"], undefined],
    clodsire: [["wooper-paldea"], undefined],
};

export default changedEvos;