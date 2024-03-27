const { EmbedBuilder } = require("discord.js");
const { sep } = require("path");
const { EMBED_COLORS } = require("../../constants");
const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const start = Date.now();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const message = await interaction.followUp({
      embeds: [embed.setDescription("Pinging...")],
    });

    message.edit({
      embeds: [
        embed.setDescription(
          `Latency is ${Math.ceil(
            Date.now() - start
          )} ms \nAPI Ping is ${Math.round(
            interaction.client.ws.ping.toFixed(2)
          )} ms`
        ),
      ],
    });
  },
  {
    name: __filename.split(".js").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Returns bot and api latency",
  }
);
