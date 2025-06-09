export const COMMANDO = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
COMMANDO.attributes = {
  might: "COMMANDO.AttributeMight",
  coordination: "COMMANDO.AttributeCoordination", 
  endurance: "COMMANDO.AttributeEndurance",
  intellect: "COMMANDO.AttributeIntellect",
  guile: "COMMANDO.AttributeGuile",
  guts: "COMMANDO.AttributeGuts",
  bearing: "COMMANDO.AttributeBearing",
  charm: "COMMANDO.AttributeCharm",
  composure: "COMMANDO.AttributeComposure"
};

COMMANDO.attributeAbbreviations = {
  might: "COMMANDO.AttributeMightAbbr",
  coordination: "COMMANDO.AttributeCoordinationAbbr",
  endurance: "COMMANDO.AttributeEnduranceAbbr", 
  intellect: "COMMANDO.AttributeIntellectAbbr",
  guile: "COMMANDO.AttributeGuileAbbr",
  guts: "COMMANDO.AttributeGutsAbbr",
  bearing: "COMMANDO.AttributeBearingAbbr",
  charm: "COMMANDO.AttributeCharmAbbr",
  composure: "COMMANDO.AttributeComposureAbbr"
};

/**
 * Combat Skills
 */
COMMANDO.combatSkills = {
  heavyWeapons: "COMMANDO.SkillHeavyWeapons",
  explosiveOrdinance: "COMMANDO.SkillExplosiveOrdinance",
  grenadeThrowing: "COMMANDO.SkillGrenadeThrowing",
  machineGunner: "COMMANDO.SkillMachineGunner",
  meleeCombat: "COMMANDO.SkillMeleeCombat",
  pistols: "COMMANDO.SkillPistols",
  rifles: "COMMANDO.SkillRifles",
  submachineGuns: "COMMANDO.SkillSubmachineGuns",
  unarmedCombat: "COMMANDO.SkillUnarmedCombat"
};

/**
 * General Skills
 */
COMMANDO.generalSkills = {
  athletics: "COMMANDO.SkillAthletics",
  climb: "COMMANDO.SkillClimb", 
  concealmentCamouflage: "COMMANDO.SkillConcealmentCamouflage",
  cryptography: "COMMANDO.SkillCryptography",
  endurance: "COMMANDO.SkillEndurance",
  firstAid: "COMMANDO.SkillFirstAid",
  linguistics: "COMMANDO.SkillLinguistics",
  navigation: "COMMANDO.SkillNavigation",
  parachuting: "COMMANDO.SkillParachuting",
  radioOperations: "COMMANDO.SkillRadioOperations",
  stalking: "COMMANDO.SkillStalking",
  survival: "COMMANDO.SkillSurvival",
  swimming: "COMMANDO.SkillSwimming"
};

/**
 * Breeding Categories
 */
COMMANDO.breedingCategories = {
  physical: "COMMANDO.BreedingPhysical",
  mental: "COMMANDO.BreedingMental", 
  social: "COMMANDO.BreedingSocial"
};

/**
 * Mindset Categories
 */
COMMANDO.mindsets = {
  force: "COMMANDO.MindsetForce",
  finesse: "COMMANDO.MindsetFinesse",
  resilience: "COMMANDO.MindsetResilience"
};

/**
 * Weapon Types
 */
COMMANDO.weaponTypes = {
  pistol: "COMMANDO.WeaponPistol",
  rifle: "COMMANDO.WeaponRifle", 
  submachineGun: "COMMANDO.WeaponSubmachineGun",
  machineGun: "COMMANDO.WeaponMachineGun",
  heavyWeapon: "COMMANDO.WeaponHeavyWeapon",
  explosive: "COMMANDO.WeaponExplosive",
  melee: "COMMANDO.WeaponMelee",
  thrown: "COMMANDO.WeaponThrown"
};