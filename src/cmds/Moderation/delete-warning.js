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

    const warningId = interaction.options.getString("id", true);
    const warnings = await interaction.guild.db.getWarningByID(warningId);

    try {
      if (warnings.length < 1)
        return await interaction.followUp({
          embeds: [
            embed
              .setColor(EMBED_COLORS.WARNING)
              .setDescription(`**No warning found under given id**`),
          ],
        });

      await interaction.guild.db.clearWarning(warningId);

      await interaction.followUp({
        embeds: [
          embed.setDescription(
            `**Cleared warning with ID:** ` + "`" + `${warningId}` + "`"
          ),
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
        embeds: [embed.setDescription(`**No warning found under given id**`)],
      });
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Deletes a user's warn by id",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .string({
        name: "id",
        description: "ID of the warning",
        required: true,
      })
      .string({
        name: "reason",
        description: "Reason to clear the warning",
        required: false,
      })
      .toJSON(),
  }
);
