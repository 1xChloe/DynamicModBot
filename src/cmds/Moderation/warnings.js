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

    const member =
      interaction.options.getMember("member", false) || interaction.member;

    const warnings = await interaction.guild.db.getWarnings(member.user.id);

    if (!warnings.length)
      return interaction.followUp({
        embeds: [embed.setDescription(`**${member} has no warnings**`)],
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
      `${member.user.username} has ${warnings.length} warning(s)`
    );

    pagination.setColor(EMBED_COLORS.BASE);
    pagination.setFooter({
      text: `${config.version} || Page: {pageNumber}/{totalPages}`,
    });
    pagination.setTimestamp();

    for (let idx = 0; idx < warnings.length; idx++) {
      const obj = await warnings[idx];
      if (obj) {
        pagination.addFields([
          {
            name:
              `Warning ID: ` +
              "`" +
              `${obj.id}` +
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
    description: "Checks a user's warnings",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: false,
      })
      .toJSON(),
  }
);
