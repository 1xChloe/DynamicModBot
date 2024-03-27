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
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const reason =
      interaction.options.getString("reason", false) || "No Reason Given";
    const member = interaction.options.getMember("member", true);
    const warnings = await interaction.guild.db.getWarnings(member.id);

    try {
      if (warnings.length < 1)
        return await interaction.followUp({
          embeds: [embed.setDescription(`**${member} has no warnings**`)],
        });

      await interaction.guild.db.clearWarnings(member.id);

      await interaction.followUp({
        embeds: [
          embed.setDescription(`**Cleared all warnings for: ${member}**`),
        ],
      });

      await db.setModLog(
        __filename.split(".").shift().split(sep).pop(),
        member.user.id,
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
        member.user.id,
        await db.getModsLogs(interaction.user.id).slice(-1)[0].caseId
      );
    } catch (e) {
      console.log(e);
      await interaction.followUp({
        embeds: [embed.setDescription(`**${member} has no warnings**`)],
      });
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Deletes all of a user's warnings",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .string({
        name: "reason",
        description: "Reason to clear warnings",
        required: false,
      })
      .toJSON(),
  }
);
