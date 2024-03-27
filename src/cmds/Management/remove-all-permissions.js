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

    const roleGiven = interaction.options.getRole("role", true);
    await db.setPermission(roleGiven.id, []);

    await interaction.followUp({
      embeds: [
        embed.setDescription(
          `**${roleGiven.toString()} has lost permissions for every command**`
        ),
      ],
    });
  },
  {
    name: __filename.split(".js").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Removes a role from all command permissions",
    permissions: [],
    options: dkto.builder
      .command_options()
      .role({
        name: "role",
        description: "Role of which to change permissions for",
        required: true,
      })
      .toJSON(),
  }
);
