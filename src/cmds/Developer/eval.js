const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { TextChannel, EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const moment = require("moment");

create_command(
  async function (interaction, roleids, roleperms, db) {
    const content = interaction.options.getString("content");

    try {
      await interaction.followUp({
        content: `\`\`\`\n${String(eval(String(content)))
          .replace(/`+/, "\\`")
          .replace(/\\+/, "\\\\")}\n\`\`\``,
      });
    } catch (exception) {
      interaction.followUp({
        content: `Error:\n\`\`\`\n${String(exception)
          .replace(/`+/, "\\`")
          .replace(/\\+/, "\\\\")
          .substring(0, 2048)}\n\`\`\``,
      });
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Executes the given code and returns the output",
    ephemeral: false,
    is_developer: true,
    options: dkto.builder
      .command_options()
      .string({
        name: "content",
        description: "Executes the given code",
        required: true,
      })
      .toJSON(),
  }
);
