const { EmbedBuilder } = require("discord.js");
const { dkto } = require("dkto.js");
const config = require("../../../config.json");
const { sep } = require("path");
const { EMBED_COLORS } = require("../../constants");
const {
  create_command,
  list,
  get_command,
} = require("../../handlers/commands");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setDescription(`**Working...**`)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const roleGiven = interaction.options.getRole("role", true);
    let permissions = await db.getPermission(roleGiven.id);
    if (roleGiven.permissions.has("Administrator"))
      permissions = Object.keys(list).filter(
        (name) => get_command(name).config.category !== "Developer"
      );

    permissions.length > 0 ? permissions.join("`, `") : "No Permissions";
    await interaction.followUp({
      embeds: [
        embed.setDescription(
          `**${roleGiven.toString()} has permissions to: ** ${
            permissions.length > 0
              ? "\n" + `\`${permissions.join("`, `")}\``
              : "`No Permissions`"
          }`
        ),
      ],
    });
  },
  {
    name: __filename.split(".js").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Gets a roles permissions",
    permissions: [],
    options: dkto.builder
      .command_options()
      .role({
        name: "role",
        description: "Role of which to fetch permissions for",
        required: true,
      })
      .toJSON(),
  }
);
