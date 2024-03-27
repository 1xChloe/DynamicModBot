const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    try {
      let serverConfig = await db.getConfiguration();

      await interaction.followUp({
        embeds: [
          embed.setDescription(
            `**<@&${serverConfig.mutedRole}> is the muted role\n<#${serverConfig.logChannel}> is the log channel**`
          ),
        ],
      });
    } catch (e) {
      console.log(e);
      await interaction.followUp({
        embeds: [embed.setDescription("An error occured")],
      });
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Shows the server's current configuration",
    options: dkto.builder.command_options().toJSON(),
  }
);
