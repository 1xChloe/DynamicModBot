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

    const member = interaction.options.getMember("member", true);
    const reason =
      interaction.options.getString("reason", false) || "No Reason Given";

    if (member.id === interaction.client.id)
      return await interaction.followUp({
        embeds: [
          embed
            .setColor(EMBED_COLORS.WARNING)
            .setDescription(`**Moderation commands won't work on me**`),
        ],
      });

    const idstring = [...new Array(15).keys()]
      .map((key) => String.fromCharCode(Math.floor(Math.random() * 15) + 65))
      .map((key) =>
        String(key)[
          `to${new Array("Lower", "Upper")[Math.floor(Math.random() * 2)]}Case`
        ]()
      )
      .join("");

    await db.setWarning(idstring, member.user.id, interaction.user.id, reason);

    await interaction.followUp({
      embeds: [embed.setDescription(`**${member} was warned for: ${reason}**`)],
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
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Warns a user for given reason",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .string({
        name: "reason",
        description: "Reason why the user was warned",
        required: false,
      })
      .toJSON(),
  }
);
