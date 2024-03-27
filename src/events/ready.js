const { Client } = require("discord.js");
const { load } = require("../handlers/commands");
const { list } = require("../handlers/commands");
const { get_db } = require("../utils/Database");

module.exports.bot;

/**
 *
 * @param {Client} bot
 */
module.exports = async function (bot) {
  module.exports.bot = bot;

  const cmds = await bot.application.commands.fetch();

  for (const [name, cmd] of cmds) {
    list[cmd.name] = cmd;
  }

  await load(bot);

  console.log(bot.user.tag, "has started!");
  bot.user.setActivity(`My Developer Learn`, {
    type: 3,
  });
  console.log(
    bot.generateInvite({
      permissions: ["Administrator"],
      scopes: ["applications.commands", "bot"],
    })
  );

  for (const guild of bot.guilds.cache.toJSON()) get_db(guild, bot);
};
