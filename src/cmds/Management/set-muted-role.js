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

    const setRole = interaction.options.getRole("role", true);

    try {
      await db.setConfiguration(setRole.id, null, null);

      await interaction.followUp({
        embeds: [
          embed.setDescription(
            `**Successfully set ${setRole.toString()} as the servers muted role**`
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
    description: "Sets the servers muted role",
    options: dkto.builder
      .command_options()
      .role({
        name: "role",
        description: "Role for muted users",
        required: true,
      })
      .toJSON(),
  }
);
