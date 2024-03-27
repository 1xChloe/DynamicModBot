const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { stripIndents } = require("common-tags");
const { Pagination } = require("pagination.djs");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const member = interaction.options.getMember("member", true);
    const modCase = db.getModsLogs(member.user.id);

    if (!modCase.length > 0)
      return interaction.followUp({
        embeds: [embed.setDescription(`**No cases found for: ${member}**`)],
      });

    const pagination = new Pagination(interaction, {
      firstEmoji: "⏮",
      prevEmoji: "◀️",
      nextEmoji: "▶️",
      lastEmoji: "⏭",
      limit: 5,
      idle: 30000,
      ephemeral: false,
      loop: false,
    });

    pagination.setTitle(
      `${member.user.username} has ${modCase.length} moderation log(s)`
    );

    pagination.setColor(EMBED_COLORS.BASE);
    pagination.setFooter({
      text: `${config.version} || Page: {pageNumber}/{totalPages}`,
    });
    pagination.setTimestamp();

    for (let idx = 0; idx < modCase.length; idx++) {
      const obj = await modCase[idx];
      if (obj) {
        pagination.addFields([
          {
            name:
              `Action: ` +
              "`" +
              `${obj.log}` +
              "`" +
              ` | Moderator: ${
                (await interaction.client.users.fetch(obj.moderator))
                  ? (await interaction.client.users.fetch(obj.moderator)).tag
                  : "\\@invalid-user"
              }`,
            value: stripIndents`${obj.reason} - ` + " `" + `${obj.date}` + "`",
          },
        ]);
      }
    }
    pagination.paginateFields(true);
    pagination.render();
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Checks a moderation log",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Member to check the moderation logs for",
        required: true,
      })
      .toJSON(),
  }
);
