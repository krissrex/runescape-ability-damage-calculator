import { calculateMeleeDamage, MeleeWeapon } from "./calculate";
import gear from "./gear.json";

function test() {
  {
    const damageResult = calculateMeleeDamage({
      strengthBonus: 196,
      strengthLevel: 99,
      mainHand: gear.weapons["Drygore mace"] as MeleeWeapon,
      offHand: gear.weapons["Off-hand drygore mace"] as MeleeWeapon,
    });

    console.log(
      `Expected: 1960\nActual: ${
        damageResult.result
      }\n\t${damageResult.formulas
        .map((formula) => `${formula.name}: ${formula.value}`)
        .join("\n\t")}`
    );
  }

  // Decimate
  {
    const damageResult = calculateMeleeDamage({
      strengthBonus: 196,
      strengthLevel: 99,
      mainHand: gear.weapons["Drygore mace"] as MeleeWeapon,
      offHand: gear.weapons["Off-hand drygore mace"] as MeleeWeapon,
    });
    const abilityMultiplier = testAbility * precise6equilibrium4Multiplier;
    const decimateMaxHitEquilibrium4 = Math.floor(
      damageResult.result * abilityMultiplier
    );

    console.log("Expected:", 3577, "\nActual:", decimateMaxHitEquilibrium4);
    console.log(
      "\t" +
        damageResult.formulas
          .map((formula) => `${formula.name}: ${formula.value}`)
          .join("\n\t")
    );
    console.log("\tAbility multiplier with P6E4", abilityMultiplier);
  }
}

const prayers = [
  //{ name: "None", abilityMultiplier: 1 },
  { name: "Turmoil", abilityMultiplier: 1.1 },
  { name: "Malevolence", abilityMultiplier: 1.12 },
];

const decimateAbilityDamage = 1.88;
const assaultAbilityDamage = 2.19;

// 9% of max hit is added to min hit % by precise6.
// 4% of damage range (max-min) is subtracted from max hit by equilibrium4.
// Originally 0.9716, but jagex might be using only 3 decimals. Gives correct result for decimate/drygores at least.
const precise6equilibrium4Multiplier = 0.971; // For abilities that do 1:5 ratio of min:max damage, like Decimate and Assault

const testAbility = decimateAbilityDamage;
//const testAbility = assaultAbilityDamage;

function overload() {
  // Assuming lvl 99
  const overloads = [
    { name: "None", boost: 0 },
    { name: "Overload", boost: 17 },
    { name: "Supreme overload", boost: 19 },
    { name: "Elder overload", boost: 21 },
  ];

  for (const overload of overloads) {
    const damageResult = calculateMeleeDamage({
      strengthBonus: 196,
      strengthLevel: 99 + overload.boost,
      mainHand: gear.weapons["Drygore mace"] as MeleeWeapon,
      offHand: gear.weapons["Off-hand drygore mace"] as MeleeWeapon,
    });

    console.log(
      `Damage with ${overload.name} (+${overload.boost}) : ${damageResult.result}`
    );
    const damagePerLevel = overload.boost * 8; //FIXME: Apply p6E4. Range is (4-8).
    console.log("\tAbility damage gets +" + damagePerLevel);

    const decimateMaxHit = Math.floor(
      damageResult.result * testAbility + damagePerLevel
    );
    console.log(`\tMax hit: ${decimateMaxHit}`);
    const decimateMaxHitP6E4 = Math.floor(
      damageResult.result * (testAbility * precise6equilibrium4Multiplier) +
        damagePerLevel
    );
    console.log(`\tMax hit (P6E4): ${decimateMaxHitP6E4}`);

    const berserkCrit = Math.min(
      12000,
      Math.floor(decimateMaxHitP6E4 * 2)
    ); // Crit damage cap is 12k
    console.log(`\tBerserk max hit (P6E4): ${berserkCrit}`);

    for (const prayer of prayers) {
      console.log(
        `\tBerserk ${prayer.name} max hit (P6E4): ${Math.floor(
          berserkCrit * prayer.abilityMultiplier
        )}`
      );
    }
  }
}

type WeaponName = keyof typeof gear.weapons;
interface Overload {
  name: string;
  level: number;
}

interface AbilityDamageMaxHits {
  berserkerAuraDamage: number;
  damagePerLevel: number;
  berserkerMaxHit: number;
  berserkerMaxHitEq4: number;
  berserkerBerserkMaxHitEq4: number;
  berserkerBerserkMaxHitEq4Turmoil: number;
  berserkerBerserkMaxHitEq4Malevolence: number;
}

function overloadAndBerserker(
  overload: Overload,
  offHand: WeaponName
): AbilityDamageMaxHits {
  const result: AbilityDamageMaxHits = {
    damagePerLevel: NaN,
    berserkerAuraDamage: NaN,
    berserkerBerserkMaxHitEq4: NaN,
    berserkerBerserkMaxHitEq4Malevolence: NaN,
    berserkerBerserkMaxHitEq4Turmoil: NaN,
    berserkerMaxHit: NaN,
    berserkerMaxHitEq4: NaN,
  };

  const damageResult = calculateMeleeDamage({
    strengthBonus: 196,
    strengthLevel: overload.level,
    mainHand: gear.weapons["Drygore mace"] as MeleeWeapon,
    offHand: gear.weapons[offHand] as MeleeWeapon,
  });
  console.log("Off-hand: " + offHand);
  console.log(
    `Damage with Berserker aura and ${overload.name} (level ${overload.level}) : ${damageResult.result}`
  );
  result.berserkerAuraDamage = damageResult.result;

  const damagePerLevel = (overload.level - 99) * 8; // is it -99 at level 99, or is it -98? Because it seems always to have +8 at no boost.
  const damagePerLevelRange =
    damagePerLevel - (overload.level - 99) * 4; // min-hit is boosted 4. FIXME: Apply P6 to this
  const damagePerLevelEq4 =
    damagePerLevel - damagePerLevelRange * 0.04;

  console.log("\tAbility damage gets +" + damagePerLevel);
  console.log("\tAbility damage with Eq4 gets +" + damagePerLevelEq4);
  result.damagePerLevel = damagePerLevel;

  const berserkerAuraMultiplier = 1.1;
  const decimateMaxHit = Math.floor(
    (damageResult.result * testAbility + damagePerLevel) *
      berserkerAuraMultiplier
  ); // When not using Berserk, the berserker aura boosts 10%. It is not applied when using berserk.
  console.log(`\tBerserker Max hit: ${decimateMaxHit}`);
  result.berserkerMaxHit = decimateMaxHit;

  const decimateMaxHitEquilibrium4 = Math.floor(
    (damageResult.result * (testAbility * precise6equilibrium4Multiplier) +
      damagePerLevelEq4) *
      berserkerAuraMultiplier
  );
  console.log(`\tMax hit (Eq4): ${decimateMaxHitEquilibrium4}`);
  result.berserkerMaxHitEq4 = decimateMaxHitEquilibrium4;

  const berserkCrit = Math.min(
    12000,
    Math.floor(
      (damageResult.result * (testAbility * precise6equilibrium4Multiplier) +
        damagePerLevelEq4) *
        2
    )
  ); // Crit damage cap is 12k
  console.log(`\tBerserker berserk max hit (Eq4): ${berserkCrit}`);
  result.berserkerBerserkMaxHitEq4 = berserkCrit;

  const berserkMultiplier = 2;
  const critCap = 12000; // FIXME: Differs with Erethdor's grimoire
  const berserkCritWithoutAbilityBoost =
    damageResult.result * (testAbility * precise6equilibrium4Multiplier) * berserkMultiplier;
  const turmoilHit = Math.floor(
    Math.min(
      critCap,
      berserkCritWithoutAbilityBoost * (1 + gear.prayers.turmoil.damageBoost) +
      berserkMultiplier * damagePerLevelEq4 // all boosts expect prayer affect abilityDamageBoostEq4
    )
  );
  console.log(`\tBerserker berserk turmoil max hit (Eq4): ${turmoilHit}`);
  result.berserkerBerserkMaxHitEq4Turmoil = turmoilHit;

  const malevolenceHit = Math.floor(
    Math.min(
      critCap,
      berserkCritWithoutAbilityBoost *
        (1 + gear.prayers.malevolence.damageBoost) +
        berserkMultiplier * damagePerLevelEq4 // all boosts expect prayer affect abilityDamageBoostEq4
    )
  );
  console.log(
    `\tBerserker berserk malevolence max hit (Eq4): ${malevolenceHit}`
  );
  result.berserkerBerserkMaxHitEq4Malevolence = malevolenceHit;

  return result;
}

test();
console.log("--------");
overload();
console.log("--------");

const offHands: Array<WeaponName> = [
  "Off-hand drygore mace",
  //  "Off-hand drygore rapier",
];
// Assuming lvl 99
const overloads: Overload[] = [
  { name: "None", level: 108 },
  { name: "Overload", level: 126 },
  { name: "Supreme overload", level: 128 },
  { name: "Elder overload", level: 130 },
];

const results: any = {};
for (const offHand of offHands) {
  for (const overload of overloads) {
    results[offHand + " - " + overload.name] = overloadAndBerserker(
      overload,
      offHand
    );
    console.log("--------");
  }
}

console.table(results);
