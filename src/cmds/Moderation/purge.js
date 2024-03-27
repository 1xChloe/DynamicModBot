const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { purgeLogHook } = require("../../utils/functions");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setDescription(`**Purging...**`)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const editMsg = await interaction.followUp({
      embeds: [embed],
    });

    const amount = interaction.options.getNumber("count", true);
    const reason = "No Reason Needed";
    const duration = null;

    if (amount < 0)
      return await editMsg[
        editMsg.editable ? "edit" : editMsg.replied ? "editReply" : "update"
      ]({
        embeds: [
          embed
            .setColor(EMBED_COLORS.WARNING)
            .setDescription(`**The amount must be a positive number over 0**`),
        ],
      });

    const messages = await interaction.channel.messages.fetch({
      limit: amount + 1,
    });

    const userMessages = messages.filter((msg) => {
      return msg.author.id !== interaction.client.user.id;
    });

    await interaction.channel.bulkDelete(userMessages, true);

    await editMsg[
      editMsg.editable ? "edit" : editMsg.replied ? "editReply" : "update"
    ]({
      embeds: [
        embed.setDescription(`**Successfully purged ${amount} messages**`),
      ],
    });

    purgeLogHook(
      interaction.guild,
      __filename.split(".").shift().split(sep).pop(),
      __dirname.split(sep).pop(),
      interaction.user.id,
      interaction.channel.id,
      amount
    );
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Purges the given amount of messages",
    options: dkto.builder
      .command_options()
      .number({
        name: "count",
        description: "Amount of messages to purge",
        required: true,
      })
      .toJSON(),
  }
);
