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

    const setChannel = interaction.options.getChannel("channel", true);

    try {
      let existingHooks = interaction.guild.fetchWebhooks();
      let MalevolenceHook = (await existingHooks).find(
        (w) => w.name === "Malevolence Logs"
      );

      if (MalevolenceHook) {
        MalevolenceHook.delete();
      }

      let whookInitialisation = await setChannel.createWebhook({
        name: "Malevolence Logs",
        avatar: interaction.client.user.displayAvatarURL(),
        reason: "UwU automatics logging hook",
      });

      await db.setConfiguration(null, setChannel.id, whookInitialisation.url);

      await interaction.followUp({
        embeds: [
          embed.setDescription(
            `**Successfully set ${setChannel.toString()} as the servers log channel**`
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
    description: "Sets the servers moderation channel",
    options: dkto.builder
      .command_options()
      .channel({
        name: "channel",
        description: "Channel to send the server logs to",
        required: true,
      })
      .toJSON(),
  }
);
