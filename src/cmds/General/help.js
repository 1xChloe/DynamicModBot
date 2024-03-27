const { EmbedBuilder } = require("discord.js");
const { sep } = require("path");
const { EMBED_COLORS } = require("../../constants");
const {
  create_command,
  list,
  get_command,
} = require("../../handlers/commands");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const commands = {};
    for (const name of Object.keys(list)) {
      const command = get_command(name);
      if (command === undefined) continue;
      commands[command.config.category] = [
        ...(command.config.category in commands
          ? commands[command.config.category]
          : []),
        command.config.name,
      ];
      commands[command.config.category].sort((a, b) => a.localeCompare(b));
    }

    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setTitle("Valid8 Commands")
          .setColor(EMBED_COLORS.BASE)
          .addFields(
            ...Object.keys(commands)
              .sort((a, b) => a.localeCompare(b))
              .map((name) => {
                return {
                  name,
                  value: commands[name].join(", "),
                  inline: false,
                };
              })
          )
          .setFooter({ text: `Suffer` })
          .setTimestamp(),
      ],
    });
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Shows the command list for this",
  }
);
