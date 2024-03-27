const { EmbedBuilder, WebhookClient } = require("discord.js");
const { EMBED_COLORS } = require("../constants");

const webhookCache = new Map();

const getWebhookClient = (serverId, webhookUrl) => {
  if (webhookCache.has(serverId)) {
    return webhookCache.get(serverId);
  }

  const newWebhookClient = new WebhookClient({ url: webhookUrl });
  webhookCache.set(serverId, newWebhookClient);
  return newWebhookClient;
};

module.exports = class Functions {
  static sleep(delay) {
    let start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  }
};

const modLogWebhook = (guild, cmd, category, moderator, user, caseId) => {
  const whook = guild.db.getConfiguration().webLink;
  const wHookClient = getWebhookClient(guild.id, whook);
  try {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setAuthor({
        name: guild.name,
      })
      .setThumbnail(guild.iconURL())
      .setDescription(`**Action: ${category} | ${cmd}**`)
      .addFields(
        { name: "Moderator:", value: `<@${moderator}>`, inline: true },
        { name: "Victim:", value: `<@${user}>`, inline: true }
      )
      .setFooter({ text: `Case ID: ${caseId}` })
      .setTimestamp();
    wHookClient.send({ embeds: [embed] });
  } catch (e) {
    console.log(e);
  }
};

module.exports.logHook = modLogWebhook;

const purgeLogHook = (guild, cmd, category, moderator, channel, amount) => {
  const whook = guild.db.getConfiguration().webLink;
  const wHookClient = getWebhookClient(guild.id, whook);
  try {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setAuthor({
        name: guild.name,
      })
      .setThumbnail(guild.iconURL())
      .setDescription(`**Action: ${category} | ${cmd}**`)
      .addFields(
        { name: "Moderator:", value: `<@${moderator}>`, inline: true },
        { name: "Channel:", value: `<#${channel}>`, inline: true }
      )
      .setFooter({ text: `Amount: ${amount}` })
      .setTimestamp();
    wHookClient.send({ embeds: [embed] });
  } catch (e) {
    console.log(e);
  }
};

module.exports.purgeLogHook = purgeLogHook;

const webhookError = (err, chan, guild, user) => {
  try {
    const embed = new EmbedBuilder()
      .setColor(`#0099ff`)
      .setAuthor({
        name: guild.name,
        icon_url: guild.iconURL(),
      })
      .setDescription(`In Channel: ${chan}, Executed By: ${user}`)
      .addField(`Error:`, "```js\n" + `${err}` + "```")
      .addField(
        `Command:`,
        String(err.stack.split("\n")[1].split("/").pop().split(")").shift())
      )
      .setTimestamp();

    Whook.send("", [embed.toJSON()]);
  } catch (err) {
    console.log(err);
  }
};
module.exports.webhookError = webhookError;
