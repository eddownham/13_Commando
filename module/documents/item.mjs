/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class CommandoItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  /**
   * Prepare weapon-specific derived data
   */
  _prepareWeaponData(itemData) {
    if (itemData.type !== 'weapon') return;

    // Set defaults
    const systemData = itemData.system;
    systemData.weaponType = systemData.weaponType || "";
    systemData.damage = systemData.damage || "1d6";
    systemData.range = systemData.range || "";
    systemData.ammo = systemData.ammo || { max: 0, value: 0 };
  }

  /**
   * Prepare equipment-specific derived data
   */
  _prepareEquipmentData(itemData) {
    if (itemData.type !== 'equipment') return;

    // Set defaults
    const systemData = itemData.system;
    systemData.quantity = systemData.quantity || 1;
    systemData.weight = systemData.weight || 0;
  }

  /**
   * Get the appropriate skill for this weapon
   * @returns {string} The skill identifier
   */
  getWeaponSkill() {
    if (this.type !== 'weapon') return null;

    const weaponType = this.system.weaponType?.toLowerCase();
    
    // Map weapon types to skills
    const skillMap = {
      'pistol': 'pistols',
      'rifle': 'rifles', 
      'submachine gun': 'submachineGuns',
      'machine gun': 'machineGunner',
      'heavy weapon': 'heavyWeapons',
      'explosive': 'explosiveOrdinance',
      'melee': 'meleeCombat',
      'thrown': 'grenadeThrowing'
    };

    return skillMap[weaponType] || 'unarmedCombat';
  }

  /**
   * Roll an attack with this weapon
   * @param {object} options - Attack options
   * @returns {Promise<Roll>}
   */
  async rollAttack(options = {}) {
    if (this.type !== 'weapon') {
      ui.notifications.warn("Only weapons can make attack rolls!");
      return;
    }

    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn("This weapon is not owned by an actor!");
      return;
    }

    const skillId = this.getWeaponSkill();
    const skillName = game.i18n.localize(CONFIG.COMMANDO.combatSkills?.[skillId] ?? skillId);
    
    // Get skill value from actor
    let skillValue = 0;
    const skills = actor.system.skills;
    for (let category in skills) {
      if (skills[category][skillId]) {
        skillValue = skills[category][skillId].value;
        break;
      }
    }

    // Create roll formula
    const formula = "1d20 + @skill";
    const rollData = {
      skill: skillValue,
      weapon: this.name
    };

    const roll = new Roll(formula, rollData);
    
    // Send to chat
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: `${this.name} Attack (${skillName})`,
      rollMode: game.settings.get('core', 'rollMode')
    });

    return roll;
  }

  /**
   * Roll damage for this weapon
   * @param {object} options - Damage options
   * @returns {Promise<Roll>}
   */
  async rollDamage(options = {}) {
    if (this.type !== 'weapon') {
      ui.notifications.warn("Only weapons can roll damage!");
      return;
    }

    const formula = this.system.damage || "1d6";
    const roll = new Roll(formula);
    
    // Send to chat
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.name} Damage`,
      rollMode: game.settings.get('core', 'rollMode')
    });

    return roll;
  }
}