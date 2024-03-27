const { EmbedBuilder } = require("discord.js");
const { dkto } = require("dkto.js");
const config = require("../../../config.json");
const { sep } = require("path");
const { EMBED_COLORS } = require("../../constants");
const { create_command } = require("../../handlers/commands");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setDescription(`**Working...**`)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const member = interaction.options.getMember("member", true);
    await db.removeModsLogs(member.id);

    await interaction.followUp({
      embeds: [
        embed.setDescription(
          `**${member.toString()} has had moderation logs purged**`
        ),
      ],
    });
  },
  {
    name: __filename.split(".js").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Removes a moderators logs",
    permissions: [],
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Moderator to remove logs for",
        required: true,
      })
      .toJSON(),
  }
);
