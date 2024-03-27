const { create_command } = require("../../handlers/commands");
const settings = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { TextChannel, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const everyone = interaction.guild.roles.everyone;
    const lock_all = !!interaction.options.getBoolean("option", false);
    const channels = [
      ...(lock_all
        ? interaction.guild.channels.cache
            .filter((channel) => channel.isText())
            .values()
        : [interaction.channel]),
    ];

    for (const channel of channels) {
      if (channel.type !== "GUILD_TEXT") continue;

      const permissions = {};

      const temp = channel.permissionOverwrites.resolve(everyone.id);

      if (temp) {
        for (const permission_string of temp.allow.toArray())
          permissions[permission_string] = true;

        for (const permission_string of temp.deny.toArray())
          permissions[permission_string] = false;
      }
      permissions["SEND_MESSAGES"] = false;

      await channel.permissionOverwrites.edit(everyone, permissions);
      await channel.setName(`${channel.name.replace(/🔒+/g, "")}🔒`);
    }

    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `**Successfully locked ${
              lock_all ? "all channels" : interaction.channel.toString()
            }**`
          )
          .setColor(EMBED_COLORS.BASE)
          .setFooter({ text: `${settings.version}` })
          .setTimestamp(),
      ],
    });
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Locks the channel said in, or the whole server",
    options: dkto.builder
      .command_options()
      .boolean({
        name: "option",
        description: "Option to lockdown all channels",
        required: false,
      })
      .toJSON(),
    permissions: ["MANAGE_CHANNELS"],
  }
);
