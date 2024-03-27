const { Client, dkto } = require("dkto.js");
const djs = require("discord.js");
const EmbedBuilder = djs.EmbedBuilder;

djs.EmbedBuilder = class extends EmbedBuilder {
  constructor(data) {
    super(data);
  }

  addField(name, value, inline) {
    this.data.fields = this.data.fields || [];
    this.data.fields.push({ name, value, inline });

    return this;
  }
};

const client = new Client({
  intents: 32767,
  allowedMentions: { parse: ["users", "roles"], repliedUser: false },
});

dkto.handler.events
  .setOptions({
    hotReload: true,
    relativePath: "./src/events",
    client,
  })
  .load();

client.login(require("./config.json").testtoken);
