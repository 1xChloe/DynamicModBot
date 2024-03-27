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

    let cmdName = interaction.options.getString("cmd_name", true);
    const roleGiven = interaction.options.getRole("role", true);
    const permissions = await db.getPermission(roleGiven.id);

    permissions.push(cmdName);

    const updated_permissions = await db.setPermission(
      roleGiven.id,
      permissions
    );
    if (updated_permissions.indexOf(cmdName) === -1) {
      cmdName = "N/A";
    }

    await interaction.followUp({
      embeds: [
        embed.setDescription(
          `**${roleGiven.toString()} has been given permissions to:** \`${cmdName}\``
        ),
      ],
    });
  },
  {
    name: __filename.split(".js").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Adds a role to a commands permissions",
    permissions: [],
    options: dkto.builder
      .command_options()
      .role({
        name: "role",
        description: "Role of which to change permissions for",
        required: true,
      })
      .string({
        name: "cmd_name",
        description: "Name of the command to allow",
        required: true,
      })
      .toJSON(),
  }
);
