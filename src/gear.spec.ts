import gear from "./gear.json";

type Armour = keyof typeof gear.armour;

function vindictaLoadout() {
  const loadout: Armour[] = [
    "Bandos helmet",
    "Dragon rider amulet",
    "Max cape",
    "Masterwork platebody",
    "Masterwork platelegs",
    "Masterwork boots",
    "Bandos gloves",
    "Asylum surgeon's ring",
    "Illuminated book of balance"
  ];

  const sum = loadout.map(slot => gear.armour[slot].strength).reduce((aggregate, strengthBonus) => aggregate + strengthBonus, 0);

  console.log(`Expected: 196\nActual: ${sum}`)
}

vindictaLoadout();
