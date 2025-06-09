/**
 * Commando RPG System for Foundry VTT
 */

// Import document classes
import { CommandoActor } from "./documents/actor.mjs";
import { CommandoItem } from "./documents/item.mjs";

// Import sheet classes
import { CommandoActorSheet } from "./sheets/actor-sheet.mjs";
import { CommandoItemSheet } from "./sheets/item-sheet.mjs";

// Import helper/utility classes and constants
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { COMMANDO } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {
  
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.commando = {
    CommandoActor,
    CommandoItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.COMMANDO = COMMANDO;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20 + @attributes.coordination.value",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = CommandoActor;
  CONFIG.Item.documentClass = CommandoItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("commando-rpg", CommandoActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("commando-rpg", CommandoItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command
  const command = `game.commando.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "commando-rpg.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}