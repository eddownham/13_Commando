import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class CommandoActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["commando-rpg", "sheet", "actor"],
      template: "systems/commando-rpg/templates/actor/actor-character-sheet.html",
      width: 1500,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /** @override */
  get template() {
    return `systems/commando-rpg/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Calculate attribute totals
    const attributes = context.system.attributes;
    
    // Calculate category totals
    context.system.totals.physical = attributes.might.value + attributes.coordination.value + attributes.endurance.value;
    context.system.totals.mental = attributes.intellect.value + attributes.guile.value + attributes.guts.value;
    context.system.totals.social = attributes.bearing.value + attributes.charm.value + attributes.composure.value;
    
    // Calculate approach totals
    context.system.totals.force = attributes.might.value + attributes.intellect.value + attributes.bearing.value;
    context.system.totals.finesse = attributes.coordination.value + attributes.guile.value + attributes.charm.value;
    context.system.totals.resilience = attributes.endurance.value + attributes.guts.value + attributes.composure.value;

    // Calculate skill totals
    this._calculateSkillTotals(context);
  }

  /**
   * Calculate skill totals for all skills
   * @param {Object} context 
   */
  _calculateSkillTotals(context) {
    const skills = context.system.skills;
    
    // Calculate totals for each skill
    for (let category in skills) {
      for (let skill in skills[category]) {
        const skillData = skills[category][skill];
        if (skillData.hasOwnProperty('breeding')) {
          skillData.value = skillData.breeding + skillData.commando + skillData.primary + skillData.secondary + skillData.tertiary;
        }
      }
    }

    // Calculate column totals
    let breedingTotal = 0, commandoTotal = 0, primaryTotal = 0, secondaryTotal = 0, tertiaryTotal = 0;
    
    for (let category in skills) {
      for (let skill in skills[category]) {
        const skillData = skills[category][skill];
        if (skillData.hasOwnProperty('breeding')) {
          breedingTotal += skillData.breeding;
          commandoTotal += skillData.commando;
          primaryTotal += skillData.primary;
          secondaryTotal += skillData.secondary;
          tertiaryTotal += skillData.tertiary;
        }
      }
    }

    context.skillTotals = {
      breeding: breedingTotal,
      commando: commandoTotal,
      primary: primaryTotal,
      secondary: secondaryTotal,
      tertiary: tertiaryTotal,
      total: breedingTotal + commandoTotal + primaryTotal + secondaryTotal + tertiaryTotal
    };
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const weapons = [];
    const equipment = [];
    const skills = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      let item = i;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to specific arrays
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      else if (i.type === 'equipment') {
        equipment.push(i);
      }
      else if (i.type === 'skill') {
        skills.push(i);
      }
    }

    // Assign and return
    context.weapons = weapons;
    context.equipment = equipment;
    context.skills = skills;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Attribute and skill input changes
    html.find('.attribute-input, .skill-input').change(this._onAttributeChange.bind(this));

    // Breeding dropdown changes
    html.find('.breeding-select').change(this._onBreedingChange.bind(this));

    // Mindset dropdown changes
    html.find('.mindset-select').change(this._onMindsetChange.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData()).roll();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle attribute/skill value changes
   * @param {Event} event 
   */
  async _onAttributeChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const field = element.dataset.field;
    const value = parseInt(element.value) || 0;

    // Update the actor with the new value
    await this.actor.update({[field]: value});
  }

  /**
   * Handle breeding selection changes
   * @param {Event} event 
   */
  async _onBreedingChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const field = element.dataset.field;
    const value = element.value;

    await this.actor.update({[field]: value});
  }

  /**
   * Handle mindset selection changes
   * @param {Event} event 
   */
  async _onMindsetChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const value = element.value;

    await this.actor.update({"system.details.mindset": value});
  }
}