/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class CommandoActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from a macro).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.commando || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Calculate attribute totals
    const attributes = systemData.attributes;
    
    // Calculate category totals (Physical, Mental, Social)
    systemData.totals.physical = attributes.might.value + attributes.coordination.value + attributes.endurance.value;
    systemData.totals.mental = attributes.intellect.value + attributes.guile.value + attributes.guts.value;
    systemData.totals.social = attributes.bearing.value + attributes.charm.value + attributes.composure.value;
    
    // Calculate approach totals (Force, Finesse, Resilience)
    systemData.totals.force = attributes.might.value + attributes.intellect.value + attributes.bearing.value;
    systemData.totals.finesse = attributes.coordination.value + attributes.guile.value + attributes.charm.value;
    systemData.totals.resilience = attributes.endurance.value + attributes.guts.value + attributes.composure.value;

    // Calculate skill totals
    this._calculateSkillTotals(systemData);

    // Calculate derived resources
    systemData.health.max = systemData.totals.physical + systemData.totals.resilience;
    systemData.stamina.max = systemData.totals.physical + systemData.totals.mental;
  }

  /**
   * Calculate skill totals for all skills
   * @param {Object} systemData 
   */
  _calculateSkillTotals(systemData) {
    const skills = systemData.skills;
    
    // Calculate totals for each skill
    for (let category in skills) {
      for (let skill in skills[category]) {
        const skillData = skills[category][skill];
        if (skillData.hasOwnProperty('breeding')) {
          skillData.value = skillData.breeding + skillData.commando + skillData.primary + skillData.secondary + skillData.tertiary;
        }
      }
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /**
   * Handle how changes to a Token attribute bar are applied to the Actor.
   * This allows for game systems to override this behavior and deploy special logic.
   * @param {string} attribute    The attribute path
   * @param {number} value        The target attribute value
   * @param {boolean} isDelta     Whether the number represents a relative change (true) or an absolute change (false)
   * @param {boolean} isBar       Whether the new value is part of an attribute bar, or just a direct value
   * @returns {Promise<documents.Actor>}  The updated Actor document
   */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    const current = foundry.utils.getProperty(this.system, attribute);

    // Determine the updates to make to the actor data
    let updates;
    if (isBar) {
      if (isDelta) value = Math.clamped(0, Number(current.value) + value, current.max);
      updates = { [`system.${attribute}.value`]: value };
    } else {
      if (isDelta) value = Number(current) + value;
      updates = { [`system.${attribute}`]: value };
    }

    // Call a hook to handle token resource bar changes
    const allowed = Hooks.call("modifyTokenAttribute", {
      attribute,
      value,
      isDelta,
      isBar
    }, updates);
    return allowed !== false ? this.update(updates) : this;
  }

  /**
   * Roll a Skill Check
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} skillId      The skill id (e.g. "athletics")
   * @param {object} options      Options which configure how the skill check is rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */
  rollSkill(skillId, options = {}) {
    const label = game.i18n.localize(CONFIG.COMMANDO.skills?.[skillId] ?? skillId);
    const rollData = this.getRollData();

    // Get the skill value
    let skillValue = 0;
    const skills = rollData.skills;
    
    // Search through skill categories to find the skill
    for (let category in skills) {
      if (skills[category][skillId]) {
        skillValue = skills[category][skillId].value;
        break;
      }
    }

    // Compose roll parts and data
    const parts = ["1d20", "@mod"];
    const data = {
      mod: skillValue,
      skill: skillValue
    };

    // Reliable talent applies to all skill checks
    if (skillValue >= 1) {
      parts[0] = "1d20min10";
    }

    // Call the roll helper utility
    return d20Roll({
      event: options.event,
      parts: parts,
      data: data,
      title: `${label} Skill Check`,
      flavor: label,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      halflingLucky: false,
      reliable: skillValue >= 1,
      chatMessage: options.chatMessage,
      fastForward: options.fastForward,
      advantage: options.advantage,
      disadvantage: options.disadvantage
    });
  }

  /**
   * Roll an Attribute Check
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} attributeId    The attribute id (e.g. "might")
   * @param {object} options        Options which configure how the attribute check is rolled
   * @return {Promise<Roll>}        A Promise which resolves to the created Roll instance
   */
  rollAttribute(attributeId, options = {}) {
    const label = game.i18n.localize(CONFIG.COMMANDO.attributes?.[attributeId] ?? attributeId);
    const rollData = this.getRollData();
    const attr = rollData.attributes[attributeId];

    // Compose roll parts and data
    const parts = ["1d20", "@mod"];
    const data = {
      mod: attr.value,
      attr: attr.value
    };

    // Call the roll helper utility
    return d20Roll({
      event: options.event,
      parts: parts,
      data: data,
      title: `${label} Check`,
      flavor: label,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      halflingLucky: false,
      reliable: false,
      chatMessage: options.chatMessage,
      fastForward: options.fastForward,
      advantage: options.advantage,
      disadvantage: options.disadvantage
    });
  }
}