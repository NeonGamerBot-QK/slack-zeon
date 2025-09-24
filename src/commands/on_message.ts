// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import * as Sentry from "@sentry/node";
import { ModifiedApp } from "../modules/slackapp";
import { compareSync } from "bcrypt";
import { EncryptedJsonDb } from "../modules/encrypted-db";
import { sendSchedule } from "../modules/robotics";
import { potatoGame } from "../modules/randomResponseSystem";
import { getMessageCount } from "../modules/howWasYourDay";
import { getTextVersionOfData } from "../modules/flightly";
const clean = async (text) => {
  // If our input is a promise, await it before continuing
  if (text && text.constructor?.name == "Promise") text = await text;

  // If the response isn't a string, `util.inspect()`
  // is used to 'stringify' the code in a safe way that
  // won't error out on objects with circular references
  // (like Collections, for example)
  if (typeof text !== "string") {
    text = util.inspect(text, { depth: 1 });
  }

  // Replace symbols with character code alternatives
  text = text
    .replace(/`/g, "`" + String.fromCharCode(8203))
    .replace(/@/g, "@" + String.fromCharCode(8203));

  Object.entries(process.env).forEach(([k, v]) => {
    if (v.length > 3) {
      text = text.replaceAll(v, `[process.env.${k}]`);
    }
  });
  // Send off the cleaned up result
  return text;
};

export default class Message implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `Handles message based commands.`;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.event(this.name, async (par) => {
      Sentry.startSpan(
        {
          op: "prod",
          name: "Message event - main one",
        },
        async () => {
          //  console.debug(par);
          //   if (!par.ack) return;
          //   console.debug(0);
          if (!par.say) return;
          // console.log(
          //   `uh one of them are here`,
          //   par.event.text,
          //   par.event.channel_type,
          // );
          //@ts-ignore
          if (par.ack) await par.ack();
          if (par.event.channel_type !== "im") return;
          if (!par.event.text) return;
          if (!par.event.text.startsWith("!")) return;
          //@ts-ignore
          console.debug(`cmd`);
          const { event, say } = par;

          const args = event.text.slice(1).trim().split(/ +/);
          const cmd = args.shift().toLowerCase();
          // console.log(cmd, args);
          if (cmd == "eval") {
            // return say("remove me from code");
            try {
              // console.log(args);
              // Evaluate (execute) our input
              const evaled = await new Promise(async (_res, rej) => {
                let resolved = false;
                const res = (...args) => {
                  resolved = true;
                  _res(...args);
                };
                try {
                  const exec = await eval(
                    args
                      .join(" ")
                      .replaceAll("&gt;", ">")
                      .replaceAll("&lt;", "<"),
                  );
                  if (!resolved) res(exec);
                } catch (e) {
                  rej(e);
                }
              });

              // Put our eval result through the function
              // we defined above
              const cleaned = await clean(evaled);
              await say(`\`\`\`\n${cleaned}\`\`\``);
            } catch (e) {
              await say(`ERROR:\n\`\`\`${await clean(e.stack)}\`\`\``);
            }
          } else if (cmd == "afk") {
            const amIAfkRn = await app.db.get("neon_afk");
            if (amIAfkRn) {
              // app.db.delete("neon_afk");
              // app.client.chat.postMessage({
              // channel: event.user,
              // text: `Welcome back from being afk from: ${amIAfkRn} - you can now be pinged again!`,
              // });
              return;
            } else {
              const reason = args.join(" ") || "No reason provided";
              await app.db.set("neon_afk", reason);
              // push to afk sessions
              const current_sessions = await app.db.get("afk_sessions");
              if (current_sessions && Array.isArray(current_sessions)) {
                current_sessions.push({
                  reason,
                  ended_at: null,
                  created_at: Date.now(),
                });
                await app.db.set("afk_sessions", current_sessions);
              } else {
                await app.db.set("afk_sessions", [
                  {
                    reason,
                    ended_at: null,
                    created_at: Date.now(),
                  },
                ]);
              }
              app.client.chat.postMessage({
                channel: event.user,
                text: `You are now afk for: ${reason} - you will not be pinged in the meantime!`,
              });
            }
          } else if (cmd == "hello") {
            say(`Whats up`);
          } else if (cmd == "email") {
            const uinfo = await app.client.users["info"]({ user: args[0] });
            if (uinfo.user) {
              await app.client.chat.postMessage({
                text: `:email: ${uinfo.user.profile.email}`,
                channel: event.channel,
              });
            } else {
              await app.client.chat.postMessage({
                text: `:x: User not found!`,
                channel: event.channel,
              });
            }
          } else if (cmd == "slackid") {
            console.log(
              `emaiil escaped: \`${args[0].split("]").length > 1 ? args[0].split("]")[0].split("[")[1] : args[0]}\`, args0 : \`${args[0]}\``,
            );
            say(
              `emaiil escaped: \`${args[0].split("]").length > 1 ? args[0].split("]")[0].split("[")[1] : args[0]}\`, args0 : \`${args[0]}\``,
            );

            const slackId = await app.client.users
              .lookupByEmail({
                email:
                  args[0].split("|").length > 1
                    ? args[0].split("|")[1].split(">")[0]
                    : args[0],
              })
              .catch((e) => {
                return {};
              });
            if (slackId.user) {
              await say(
                `\`\`\`\n${slackId.user.id}\`\`\`, <@${slackId.user.id}>`,
              );
            } else {
              await say(`:x: User not found!`);
            }
          } else if (cmd == "getuserhash") {
            const userID = args[0] || event.user;
            const userHash = Object.keys(app.dbs.anondm.storage).find((e) =>
              compareSync(userID, e),
            );
            if (userHash) {
              say(`\`\`\`\n${userHash}\`\`\``);
            } else {
              say(`User not found!`);
            }
          } else if (cmd == "anondmstats") {
            const users = Object.keys(app.dbs.anondm.storage).length;
            const mail = Object.values(app.dbs.anondm.storage)
              .map((e) => e.messages.length)
              .reduce((a, b) => a + b, 0);
            say(`\`\`\`\nUsers: ${users}\nMessages: ${mail}\`\`\``);
          } else if (cmd == "potatogame") {
            potatoGame(app);
            app.client.chat.postMessage({
              text: `Sending the game!`,
              channel: event.channel,
            });
          } else if (cmd == "howmanymessages") {
            const _count = await app.db.get("messages_sent_yesterday");
            await say(await getMessageCount(app.db));
            await app.db.set("messages_sent_yesterday", _count);
          } else if (cmd == "flightly") {
            const flight = args[0];
            // const flightData = await getFlightData(flight)
            await say(await getTextVersionOfData(flight));
          } else if (cmd == "crackthemail") {
            const userID = args[1] || event.user;
            const mail = args[0];

            const userHash = Object.keys(app.dbs.anondm.storage).find((e) =>
              compareSync(userID, e),
            );
            if (!userHash) {
              say(`User not found!`);
              return;
            }
            const mailObj = app.dbs.anondm.get(userHash).messages[mail];
            if (!mailObj) {
              say(`Mail not found!`);
              return;
            }
            try {
              say(
                `\`\`\`\n${EncryptedJsonDb.decrypt(
                  mailObj,
                  `${userID}_` + process.env.ANONDM_PASSWORD,
                )}\`\`\``,
              );
            } catch (e) {
              say(`Error: \`\`\`\n${e}\`\`\``);
            }
          } else if (cmd == "stream") {
            // check if WS is open
            // if not; fail
            if (!app.ws) {
              await app.client.chat.postEphemeral({
                channel: event.channel,
                text: `Websocket is not open!`,
                user: event.user,
              });
              return;
            }
            const id = Date.now();
            const m = await app.client.chat.postMessage({
              channel: event.channel,
              text: `:spin-loading: Executing command: \`${args.join(" ")}\`...`,
              thread_ts: event.ts,
            });
            app.ws.emit("exec command", args.join(" "), id);
            app.ws.once("cmdout-" + id, (response) => {
              // await app.client.chat.update({
              //   channel: event.channel,
              //   ts: m.ts,
              //   text: `:white_check_mark: Command: \`${args.join(" ")}\` executed successfully!\n\`\`\`\n${response}\n\`\`\``,
              //   thread_ts: event.ts,
              // });
            });
          } else if (cmd == "setupstream") {
            if (app.ws) {
              await app.client.chat.postEphemeral({
                channel: event.channel,
                text: `Websocket is  open!`,
                user: event.user,
              });
              return;
            }
            app.ws = io(process.env.WS_STREAM_URL);
            app.ws.on("route_query", (d) => {
              app.ws.emit(JSON.parse(d).respond, "slackzeon");
            });
            app.ws.on("connect", () => {
              console.log("Connected to WS server");
            });
          } else if (cmd == "robotics") {
            const out = await sendSchedule(args.join(" "), app, `C07R8DYAZMM`);
            if (out) {
              await app.client.chat.postEphemeral({
                channel: event.channel,
                text: `Robotics schedule sent!`,
                user: event.user,
              });
            } else {
              await app.client.chat.postEphemeral({
                channel: event.channel,
                text: `Robotics schedule not sent!`,
                user: event.user,
              });
            }
          }
          console.debug(`#message-`);

          //@ts-ignore
          //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
        },
      );
    });
  }
}
