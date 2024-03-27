const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { logHook } = require("../../utils/functions");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setDescription(`**Searching...**`)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const member = interaction.options.getString("member", true);
    const reason =
      interaction.options.getString("reason", false) || "No Reason Given";

    if (member === interaction.client.id)
      return await interaction.followUp({
        embeds: [
          embed
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(`**Moderation commands won't work on me**`),
        ],
      });

    if (member === interaction.user.id)
      return await interaction.followUp({
        embeds: [
          embed
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(
              `**You cannot use moderation commands on yourself**`
            ),
        ],
      });

    await interaction.guild.bans.remove(member, { reason: reason });

    await interaction.followUp({
      embeds: [
        embed.setDescription(
          `**Successfully unbanned <@${member}> for: ${reason}**`
        ),
      ],
    });

    await db.setModLog(
      __filename.split(".").shift().split(sep).pop(),
      member,
      interaction.user.id,
      reason,
      "Moderation",
      null
    );
    logHook(
      interaction.guild,
      __filename.split(".").shift().split(sep).pop(),
      __dirname.split(sep).pop(),
      interaction.user.id,
      member,
      await db.getModsLogs(interaction.user.id).slice(-1)[0].caseId
    );
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Unbans a user for given reason",
    options: dkto.builder
      .command_options()
      .string({
        name: "member",
        description: "Paste a users id into this field",
        required: true,
      })
      .string({
        name: "reason",
        description: "Reason why the user was unbanned",
        required: false,
      })
      .toJSON(),
  }
);
