const { MESSAGES, DEVELOPER_IDS, EMBED_COLORS } = require("../constants");
const { Interaction, EmbedBuilder, ButtonStyle } = require("discord.js");
const cmd_handler = require("../handlers/commands");
const Database = require("./../utils/Database");
const settings = require("../../config.json");

const dbs = {};

/**
 * @param {Interaction} interaction
 */
module.exports = async function (interaction, roleids, roleperms, db) {
  if (interaction.isCommand()) {
    if (!interaction.user || interaction.user.system || interaction.user.bot)
      return;
    if (interaction.user && interaction.user.partial)
      await interaction.user.fetch();
    if (interaction.member && interaction.member.partial)
      await interaction.member.fetch();

    interaction.guild.db = Database.get_db(
      interaction.guild,
      interaction.client
    );
    const db = interaction.guild.db;

    const embedTemplate = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setFooter({ text: `${settings.version}` })
      .setTimestamp();

    if (interaction.isChatInputCommand() && interaction.commandName) {
      if (!interaction.inGuild() || !interaction.member) {
        await interaction.deferReply({ ephemeral: false });
        return await interaction.followUp({
          embeds: [
            new EmbedBuilder(embedTemplate.toJSON()).setDescription(
              "**You cannot use commands in dms**"
            ),
          ],
        });
      }

      const cmd = cmd_handler.get_command(interaction.commandName);

      if (!cmd) return;

      if (
        !interaction.guild.members.cache
          .find((m) => m.id === interaction.client.user.id)
          .permissions.has("Administrator")
      ) {
        await interaction.deferReply({ ephemeral: false });
        return await interaction.followUp({
          embeds: [
            new EmbedBuilder(embedTemplate.toJSON()).setDescription(
              `**I require admin permissions to function**`
            ),
          ],
        });
      }

      if (DEVELOPER_IDS.indexOf(interaction.user.id) === -1) {
        if (
          cmd.config.is_developer ||
          ("permissions" in cmd.config &&
            !interaction.memberPermissions.has(cmd.config.permissions))
        ) {
          await interaction.deferReply({ ephemeral: false });
          return await interaction.followUp({
            embeds: [
              new EmbedBuilder(embedTemplate.toJSON()).setDescription(
                `**${MESSAGES.PERMISSION_DENIED}**`
              ),
            ],
          });
        }
      }

      let roleids = [];
      let roleperms = [];

      for (const guild of interaction.client.guilds.cache.toJSON()) {
        let member;
        if ((member = guild.members.cache.get(interaction.user.id))) {
          for (const role of member.roles.cache.toJSON()) {
            roleids.push(role.id);
            for (const permission of role.permissions.toArray()) {
              if (roleperms.indexOf(permission) === -1) {
                roleperms.push(permission);
              }
            }
          }
        }
      }

      let can_run_cmd = false;
      for (const id of roleids) {
        if (db.getPermission(id).indexOf(interaction.commandName) !== -1) {
          can_run_cmd = true;
          break;
        }
      }

      if (!can_run_cmd) {
        if (roleperms.indexOf("Administrator") !== -1) {
          can_run_cmd = true;
        } else if ("permissions" in cmd.config) {
          can_run_cmd =
            cmd.config.permissions.filter((p) => roleperms.indexOf(p) === -1)
              .length === 0;
        }
      }

      if (
        cmd.config.category === "Developer" &&
        DEVELOPER_IDS.indexOf(interaction.user.id) === -1
      ) {
        can_run_cmd = false;
      }

      if (!can_run_cmd) {
        await interaction
          .deferReply({
            ephemeral: true,
            fetchReply: false,
          })
          .catch(() => void -1);

        return await interaction.followUp({
          embeds: [
            new EmbedBuilder(embedTemplate.toJSON()).setDescription(
              `**You do not have the required permissions**`
            ),
          ],
        });
      }

      try {
        db.getConfiguration().logChannel;
      } catch (e) {
        console.log(e);
        await interaction
          .deferReply({
            ephemeral: false,
            fetchReply: false,
          })
          .catch(() => void -1);

        await db.setConfiguration("temp", "temp", "temp");
        await db.save();

        return await interaction.followUp({
          embeds: [
            new EmbedBuilder(embedTemplate.toJSON()).setDescription(
              `**Detected first time use, intialising databse**`
            ),
          ],
        });
      }

      const setupCmds = ["set-muted-role", "set-log-channel"];

      if (!setupCmds.includes(cmd.config.name)) {
        if (db.getConfiguration().logChannel === "temp") {
          await interaction.deferReply({ ephemeral: false });
          return await interaction.followUp({
            embeds: [
              new EmbedBuilder(embedTemplate.toJSON())
                .setDescription(`**I need a channel to send my bullshit to!**`)
                .setFooter({
                  text: "/set-log-channel to set a logging channel",
                }),
            ],
          });
        }
        if (db.getConfiguration().mutedRole === "temp") {
          await interaction.deferReply({ ephemeral: false });
          return await interaction.followUp({
            embeds: [
              new EmbedBuilder(embedTemplate.toJSON())
                .setDescription(`**I need to set a muted role before I work**`)
                .setFooter({ text: "/set-muted-role to set a muted role" }),
            ],
          });
        }
      }

      if (!cmd.config.no_defer)
        await interaction
          .deferReply({
            ephemeral: !!cmd.config.ephemeral,
            fetchReply: false,
          })
          .catch(() => void -1);

      await cmd.run(interaction, roleids, roleperms, db);
      await db.save();
    }
  }
};
