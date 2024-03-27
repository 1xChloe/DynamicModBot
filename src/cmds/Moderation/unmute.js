const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { logHook } = require("../../utils/functions");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setDescription(`**Searching...**`)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const member = interaction.options.getMember("member", true);
    const reasonRemoved =
      interaction.options.getString("reason", false) || "No Reason Given";
    const duration = null;

    if (member.id === interaction.client.id)
      return await interaction.followUp({
        embeds: [
          embed
            .setColor(EMBED_COLORS.ERROR)
            .setDescription(`**Moderation commands won't work on me**`),
        ],
      });

    if (
      !member.roles.cache.some(
        (r) => r.id === interaction.guild.db.getConfiguration().mutedRole
      )
    )
      return await interaction.followUp({
        embeds: [
          embed
            .setColor(EMBED_COLORS.WARNING)
            .setDescription(`**${member} is already unmuted**`),
        ],
      });

    if (db.getTempMutes()) {
      for (const {
        type,
        time,
        reason,
        user,
        moderator,
        date,
      } of db.getTempMutes()) {
        const currentTime = Date.now();
        const unmuteTime = new Date(new Date(date).valueOf() + Number(time));

        if (user === member.id) {
          const mutedRole = interaction.guild.roles.cache.find(
            (r) => r.id === db.getConfiguration().mutedRole
          );

          if (
            member.roles.cache.some(
              (r) => r.id === db.getConfiguration().mutedRole
            )
          ) {
            let timeLeftString = "";
            if (time) {
              const timeLeft = Math.max(unmuteTime - currentTime, 0);
              const secondsLeft = Math.floor(timeLeft / 1000);
              const minutesLeft = Math.floor(secondsLeft / 60);
              const hoursLeft = Math.floor(minutesLeft / 60);
              const daysLeft = Math.floor(hoursLeft / 24);

              if (daysLeft > 0) {
                timeLeftString += `${daysLeft}d `;
              }
              if (hoursLeft % 24 > 0) {
                timeLeftString += `${hoursLeft % 24}h, `;
              }
              if (minutesLeft % 60 > 0) {
                timeLeftString += `${minutesLeft % 60}m, `;
              }
              if (secondsLeft % 60 > 0) {
                timeLeftString += `${secondsLeft % 60}s `;
              }
              timeLeftString += "Was Left";
            } else {
              timeLeftString = "Permenant Mute";
            }

            try {
              await member.roles.remove(mutedRole);
              db.deleteTempAction(type, user);

              await interaction.followUp({
                embeds: [
                  embed
                    .setDescription(
                      `**Successfully unmuted ${member} for: ${reasonRemoved}**`
                    )
                    .setFooter({
                      text: `${timeLeftString}`,
                    }),
                ],
              });
            } catch (err) {
              console.log(`Error while unmuting user ${member}:`, err);
            }
          } else {
            console.log(`User ${member} is not muted`);
          }
        }
      }
    } else {
    }

    await db.setModLog(
      __filename.split(".").shift().split(sep).pop(),
      member.user.id,
      interaction.user.id,
      reasonRemoved,
      "Moderation",
      duration
    );
    logHook(
      interaction.guild,
      __filename.split(".").shift().split(sep).pop(),
      __dirname.split(sep).pop(),
      interaction.user.id,
      member.user.id,
      await db.getModsLogs(interaction.user.id).slice(-1)[0].caseId
    );
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Unmutes a user for given reason",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .string({
        name: "reason",
        description: "Reason why the user was muted",
        required: false,
      })
      .toJSON(),
  }
);
