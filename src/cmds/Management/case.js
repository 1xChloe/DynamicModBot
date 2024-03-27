const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { stripIndents } = require("common-tags");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const caseId = interaction.options.getInteger("id", true);
    const modCase = db.getModLog(caseId)[0];

    if (!modCase)
      return interaction.followUp({
        embeds: [
          embed.setDescription(
            `**No case found for: **` + "`" + `${caseId}` + "`"
          ),
        ],
      });

    interaction.followUp({
      embeds: [
        embed
          .setAuthor({ name: `Details for case: ${caseId}` })
          .setDescription(
            `**${modCase.log} | Duration: ${
              modCase.duration !== null ? modCase.duration : "N/A"
            }**`
          )
          .setThumbnail(interaction.guild.iconURL())
          .addFields(
            {
              name: "Moderator:",
              value: `${
                (await interaction.client.users.fetch(modCase.moderator))
                  ? (await interaction.client.users.fetch(modCase.moderator))
                      .tag
                  : "\\@invalid-user"
              }`,
              inline: true,
            },
            {
              name: "Victim:",
              value: `${
                (await interaction.client.users.fetch(modCase.user))
                  ? (await interaction.client.users.fetch(modCase.user)).tag
                  : "\\@invalid-user"
              }`,
              inline: true,
            },
            {
              name: "Reason:",
              value: `${stripIndents(modCase.reason)}`,
            }
          )
          .setFooter({
            text: `Date: ${modCase.date}`,
          })
          .setTimestamp(),
      ],
    });
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Checks a moderation log",
    options: dkto.builder
      .command_options()
      .integer({
        name: "id",
        description: "Case ID",
        required: true,
      })
      .toJSON(),
  }
);
