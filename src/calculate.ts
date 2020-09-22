import { damageFormula, speedModifiers } from "./settings.json";

export interface PlayerLoadout {
  /** Level and boosts to level. */
  strengthLevel: number;
  /**
   * From gear and jewelry.
   */
  strengthBonus: number;

  mainHand?: MeleeWeapon;
  offHand?: MeleeWeapon;
}

export interface MeleeWeapon {
  damage: number;
  speed: "average" | "fast" | "fastest";
  type: "oneHand" | "twoHand"; //|"defender"|"shield";
}

export interface Formula {
  name: string;
  value: string;
}
export interface CalculationResults {
  formulas: Formula[];
  result: number;
}

export interface Boosts {
  aura?: "berserker";
  prayer?: "turmoil" | "malevolence";
}
export function applyBoosts(baseDamage: number, boosts: Boosts): number {
  /* berkerker:
    +10 str/att lvl
    +10% melee damage (not stacking with Berserk). How does it not stack?
  */

  /*  
    overload:
    https://runescape.wiki/w/Overload#Mechanics:
    > +8 per level after all other modifiers (for having a level above your base level) 
    > - a total of +42.5 base damage (=17*2.5) and +136 to final damage (=17*8), at level 99 Strength
  */
  throw new Error("Not implemented");
}

export function calculateMeleeDamage(
  playerLoadout: PlayerLoadout
): CalculationResults {
  const strengthLevel = playerLoadout.strengthLevel;
  const strengthBonus = playerLoadout.strengthBonus;
  const mainHand = playerLoadout.mainHand;
  const offHand = playerLoadout.offHand;

  // Where are damages from overload levels added?
  // https://runescape.wiki/w/Ability_damage#Potions
  // > Each boosted level provides (4-8) extra damage to each hit you deal.
  // > Precise, Equilibrium, and Biting perks affect this extra damage.
  // > This extra damage is not affected by prayer multipliers but is affected by all other multipliers.
  // Is this EoC damage? Is this added to abilities or base?

  if (mainHand?.type == "oneHand") {
    return _calculateDualWield(strengthLevel, strengthBonus, mainHand, offHand);
  }

  throw new Error("Not supported yet");
}

function _calculateDualWield(
  strengthLevel: number,
  strengthBonus: number,
  mainHand: MeleeWeapon,
  offHand?: MeleeWeapon
): CalculationResults {
  const formula = damageFormula.melee.mainHand
    .replace("{strengthLevel}", "" + strengthLevel)
    .replace("{strengthBonus}", "" + strengthBonus)
    .replace("{mainHand.damage}", "" + mainHand.damage)
    .replace("{mainHand.speed}", "" + speedModifier(mainHand.speed));

  _verifyFormula(formula);

  const mainHandDamage = eval(formula); // No sanitizing. Don't let any baddies input evil values here ;)
  if (typeof mainHandDamage != "number" || mainHandDamage < 0) {
    throw new Error("Invalid result: " + mainHandDamage);
  }

  let offHandDamage = 0;
  let offHandFormula = undefined;
  if (offHand) {
    offHandFormula = damageFormula.melee.offHand
      .replace("{strengthLevel}", "" + strengthLevel)
      .replace("{strengthBonus}", "" + strengthBonus)
      .replace("{offHand.damage}", "" + offHand.damage)
      .replace("{offHand.speed}", "" + speedModifier(offHand.speed));

    _verifyFormula(offHandFormula);

    offHandDamage = eval(offHandFormula);
    if (typeof offHandDamage != "number" || offHandDamage < 0) {
      throw new Error("Invalid result: " + offHandDamage);
    }
  }

  const resultingDamage = Math.floor(mainHandDamage) + Math.floor(offHandDamage);

  const formulas = [{ name: "Main-hand", value: formula }];
  if (offHandFormula) {
    formulas.push({ name: "Off-hand", value: offHandFormula });
  }
  return {
    result: resultingDamage,
    formulas,
  };
}

function _verifyFormula(formula: string): void {
  if (formula.indexOf("{") != -1 || formula.indexOf("}") != -1) {
    console.error(
      "Formula was not filled completely! '{' or '}' not expected.",
      formula
    );
    throw new Error("Formula was not filled completely: " + formula);
  }

  // Just a rough sanitizing. Not good enough for security.
  const illegalCharacters = ["[", "]", ";", "'", '"'];
  for (const illegalCharacter of illegalCharacters) {
    if (formula.indexOf(illegalCharacter) != -1) {
      throw new Error(
        `Formula contains illegal character '${illegalCharacter}': ${formula}`
      );
    }
  }
}

function speedModifier(modifier: "average" | "fast" | "fastest"): number {
  return speedModifiers[modifier];
}
