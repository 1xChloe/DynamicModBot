const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { logHook } = require("../../utils/functions");
const ms = require("ms");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setDescription(`**Searching...**`)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const member = interaction.options.getMember("member", true);
    const reason =
      interaction.options.getString("reason", false) || "No Reason Given";
    const duration = interaction.options.getString("duration", false) || null;

    if (member.id === interaction.client.id)
      return await interaction.followUp({
        embeds: [
          embed
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(`**Moderation commands won't work on me**`),
        ],
      });

    if (member.id === interaction.user.id)
      return await interaction.followUp({
        embeds: [
          embed
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(
              `**You cannot use moderation commands on yourself**`
            ),
        ],
      });

    if (duration) {
      await db.setTempPunishment(
        "ban",
        ms(duration),
        reason,
        member.user.id,
        interaction.user.id
      );
    }

    await interaction.guild.members.cache
      .find((m) => m.id === member.user.id)
      .ban({ reason: reason });

    if (!duration) {
      await interaction.followUp({
        embeds: [
          embed.setDescription(
            `**Successfully banned ${member} for: ${reason}**`
          ),
        ],
      });
    } else {
      await interaction.followUp({
        embeds: [
          embed.setDescription(
            `**Successfully banned ${member} for ${duration}: ${reason}**`
          ),
        ],
      });
    }

    await db.setModLog(
      __filename.split(".").shift().split(sep).pop(),
      member.user.id,
      interaction.user.id,
      reason,
      "Moderation",
      duration
    );
    logHook(
      interaction.guild,
      __filename.split(".").shift().split(sep).pop(),
      __dirname.split(sep).pop(),
      interaction.user.id,
      member.user.id,
      await db.getModsLogs(interaction.user.id).slice(-1)[0].caseId
    );
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Bans a user for given reason",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .string({
        name: "reason",
        description: "Reason why the user was banned",
        required: false,
      })
      .string({
        name: "duration",
        description: "Length of the ban",
        required: false,
      })
      .toJSON(),
  }
);
