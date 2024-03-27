const sqlite3 = require("better-sqlite3");
const commands = require("../handlers/commands");
const utc = require("moment");

/**
 * @description Guild Object
 * @type {Object<string, import('better-sqlite3').Database>} dbs
 */
const dbs = {};
const classes = {};
/**
 * @type {import('discord.js').Client}
 */
let _client;

module.exports.Guild = class {
  /**
   *
   * @param {import('discord.js').Guild} guild
   */
  constructor(guild, client) {
    _client = _client || client;
    const id = guild?.id;
    this.guild = guild;

    // == Setting Databases in New Servers == //
    if (typeof id === "string" && !dbs[guild.id]) {
      this.db = dbs[id] = sqlite3(`dbs/Guilds/${id}.sqlite`, {
        fileMustExist: false,
      });
      classes[id] = this;

      const Warnprep = this.db
        .prepare(
          "create table if not exists Warnings (id TEXT, user TEXT, moderator TEXT, reason TEXT, date TEXT)"
        )
        .run();
      const ModLogprep = this.db
        .prepare(
          "create table if not exists ModLogs (caseId INTEGER PRIMARY KEY, log TEXT, user TEXT, moderator TEXT, reason TEXT, type TEXT, duration TEXT, date TEXT)"
        )
        .run();
      const PermsPrep = this.db
        .prepare(
          "create table if not exists Perms (RoleID TEXT, Cmds TEXT, PRIMARY KEY (RoleID))"
        )
        .run();
      const TempPunishments = this.db
        .prepare(
          "create table if not exists Temporary (type TEXT, time TEXT, reason TEXT, user TEXT, moderator TEXT, date TEXT)"
        )
        .run();
      const Configprep = this.db
        .prepare(
          "create table if not exists Config (id INTEGER PRIMARY KEY, mutedRole TEXT, logChannel TEXT, webLink TEXT)"
        )
        .run();

      let interval;
      interval = setInterval(async () => {
        if (!_client.guilds.cache.has(id)) {
          clearInterval(interval);
          this.db.close();
          delete dbs[id];
          delete classes[id];
          return;
        }

        const bans = this.getTempBans();
        const mutes = this.getTempMutes();

        if (typeof bans === "object" && typeof mutes === "object") {
          for (const { type, time, reason, user, moderator, date } of bans) {
            const d = new Date(new Date(date).valueOf() + Number(time));
            if (new Date() > d) {
              this.deleteTempAction(type, user);
              try {
                await guild.members.unban(user, "[Automatic]");
              } catch (err) {
                console.log(err);
              }
              console.log(`[Unban]: ${reason}`);
            }
          }

          for (const { type, time, reason, user, moderator, date } of mutes) {
            if (time) {
              const d = new Date(new Date(date).valueOf() + Number(time));
              if (new Date() > d) {
                try {
                  this.deleteTempAction(type, user);
                  const mem = guild.members.cache.find((m) => m.id === user);
                  const mutedRole = guild.roles.cache.find(
                    (r) => r.id === this.getConfiguration().mutedRole
                  );

                  if (
                    mem.roles.cache.some(
                      (r) => r.id === this.getConfiguration().mutedRole
                    )
                  ) {
                    try {
                      await mem.roles.remove(mutedRole);
                    } catch (err) {
                      console.log(err);
                    }
                  }
                } catch (e) {
                  console.log(e);
                }
              }
            }
          }
        }
      }, 10000);
    }

    const db = this.db;

    // == Warning Actions == //
    this.warn_query = {
      insert_into: db.prepare(
        "insert into Warnings (id,user,moderator,reason,date) values (?,?,?,?,?)"
      ),

      get_value: db.prepare("select * from Warnings where user=?"),

      get_value_by_id: db.prepare("select * from Warnings where id=?"),

      clear_value: db.prepare("delete from Warnings where id=?"),

      clear_values: db.prepare("delete from Warnings where user=?"),
    };

    // == Permission Actions == //
    this.perm = {
      _get: db.prepare("select * from Perms where RoleID=? limit 1"),
      _set: db.prepare(
        "insert into Perms (RoleID, Cmds) values (?, ?) on conflict(RoleID) do update set Cmds=?"
      ),
    };

    // == ModLog Actions == //
    this.modlog = {
      _get_mods: db.prepare("select * from ModLogs where moderator=?"),
      _get_user: db.prepare("select * from ModLogs where user=?"),
      _get_all: db.prepare("select * from ModLogs"),
      _get: db.prepare("select * from ModLogs where caseId=?"),
      _set: db.prepare(
        "insert into ModLogs (caseId,log,user,moderator,reason,type,duration,date) values (?,?,?,?,?,?,?,?)"
      ),
      _remove: db.prepare("delete from ModLogs where moderator=?"),
    };

    // == Temporary Storage == //
    this.tempActions = {
      _get: db.prepare("SELECT * FROM Temporary WHERE type = ?"),
      _delete: db.prepare("DELETE FROM Temporary WHERE type = ? and user = ?"),
      _set_case: db.prepare(
        "insert into Temporary (type,time,reason,user,moderator,date) values (?,?,?,?,?,?)"
      ),
    };

    // == Guild Configuration == //
    this.config = {
      _get: db.prepare("SELECT * FROM Config LIMIT 1"),
      _set: db.transaction((mutedRole, logChannel, webLink) => {
        const existingConfig = this.getConfiguration();

        const newMutedRole =
          mutedRole !== null ? mutedRole : existingConfig?.mutedRole || null;
        const newLogChannel =
          logChannel !== null ? logChannel : existingConfig?.logChannel || null;
        const newWebLink =
          webLink !== null ? webLink : existingConfig?.webLink || null;

        if (existingConfig) {
          db.prepare("DELETE FROM Config").run();
        }

        db.prepare(
          "INSERT INTO Config (mutedRole, logChannel, webLink) VALUES (?, ?, ?)"
        ).run(newMutedRole, newLogChannel, newWebLink);
      }),
    };
  }

  // == Warnings == //
  setWarning(...arg) {
    this.warn_query.insert_into.run(
      ...arg,
      utc(new Date(Math.round(Number(Date.now()))))
        .toDate()
        .toUTCString()
    );
  }

  getWarnings(userID) {
    return this.warn_query.get_value.all(userID);
  }

  getWarningByID(warningID) {
    return this.warn_query.get_value_by_id.all(warningID);
  }

  clearWarnings(userID) {
    this.warn_query.clear_values.run(userID);
  }

  clearWarning(warningID) {
    this.warn_query.clear_value.run(warningID);
  }

  // == Permissions == //
  /**
   * @returns {Array<string>}
   */
  getPermission(roleId) {
    return JSON.parse(this.perm._get.get(roleId)?.Cmds || "[]");
  }

  setPermission(roleId, cmds) {
    const names = Object.keys(commands.list).filter(
      (cmd_name) =>
        commands.get_command(cmd_name).config.category !== "Developer" &&
        cmds.indexOf(cmd_name) !== -1
    );

    this.perm._set.run(roleId, JSON.stringify(names), JSON.stringify(names));

    return names;
  }

  // == Modlogs == //
  getModsLogs(moderator) {
    return this.modlog._get_mods.all(moderator);
  }

  getUserLogs(user) {
    return this.modlog._get_user.all(user);
  }

  getModLog(id) {
    return this.modlog._get.all(id);
  }

  getAllModLogs() {
    return this.modlog._get_all.all();
  }

  setModLog(...arg) {
    this.modlog._set.run(
      null,
      ...arg,
      utc(new Date(Math.round(Number(Date.now()))))
        .toDate()
        .toUTCString()
    );
  }

  removeModsLogs(user) {
    this.modlog._remove.run(user);
  }

  // == Temporary Punishments ==  //
  deleteTempAction(type, userId) {
    this.tempActions._delete.run(type, userId);
  }

  getTempBans() {
    return this.tempActions._get.all("ban");
  }

  getTempMutes() {
    return this.tempActions._get.all("mute");
  }

  setTempPunishment(...arg) {
    this.tempActions._set_case.run(
      ...arg,
      utc(new Date(Math.round(Number(Date.now()))))
        .toDate()
        .toUTCString()
    );
  }

  // == Guild Configuration == //
  setConfiguration(mutedRole, logChannel, webLink) {
    this.config._set(mutedRole, logChannel, webLink);
  }

  getConfiguration() {
    return this.config._get.get();
  }

  // == Backup Creator == //
  async save() {
    await this.db.backup(`dbs/Guilds/${this.guild.id}.db`);
  }
};

module.exports.User = class {
  constructor(user) {
    this.user = user;
  }
};

module.exports.get_db = function (guild, client) {
  return classes[guild?.id] || new module.exports.Guild(guild, client);
};
