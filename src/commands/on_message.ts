// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import * as Sentry from "@sentry/node"
import { ModifiedApp } from "../modules/slackapp";

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
    Sentry.startSpan({
      op: "prod",
      name: "Message event - main one"
    }, async () => {

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
      //   await par.ack();
      if (par.event.channel_type !== "im") return;
      if (!par.event.text) return;
      if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);
      const { event, say } = par;

      const args = event.text.slice(1).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      // console.log(cmd, args);
      if (cmd == "eval") {
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
                args.join(" ").replaceAll("&gt;", ">").replaceAll("&lt;", "<"),
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
      } else if (cmd == "hello") {
        say(`Whats up`);
      } else if(cmd == "stream") {
        // check if WS is open
        // if not; fail
        if(!app.ws) {
          await app.client.chat.postEphemeral({
            channel: event.channel,
            text: `Websocket is not open!`,
            user: event.user
          })
          return;
        }
        const id = Date.now()
        const m = await app.client.chat.postMessage({
          channel: event.channel,
          text: `:spin-loading: Executing command: \`${args.join(" ")}\`...`,
          thread_ts: event.ts
        })
        app.ws.emit("exec command", args.join(" "), id)
        app.ws.once('cmdout-'+id, (response) => {
          await app.client.chat.update({
            channel: event.channel,
            ts: m.ts,
            text: `:white_check_mark: Command: \`${args.join(" ")}\` executed successfully!\n\`\`\`\n${response}\n\`\`\``,
            thread_ts: event.ts
          })
        })
      } else if(cmd == "setupstream") {
        if(app.ws) {
          await app.client.chat.postEphemeral({
            channel: event.channel,
            text: `Websocket is  open!`,
            user: event.user
          })
          return;
        }
    app.ws = io(process.env.WS_STREAM_URL)
    app.ws.on("route_query", d => {
      app.ws.emit(JSON.parse(d).respond, "slackzeon")
    })
    app.ws.on("connect", () => {
      console.log("Connected to WS server")
    })
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    })

    });
  }
}
