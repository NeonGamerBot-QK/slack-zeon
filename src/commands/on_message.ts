// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
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
  run(app: App) {
    console.debug(`#message`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      //   if (!par.ack) return;
      //   console.debug(0);
      if (!par.say) return;
      console.log(
        `uh one of them are here`,
        par.event.text,
        par.event.channel_type,
      );
      //@ts-ignore
      //   await par.ack();
      if (par.event.channel_type !== "im") return;
      if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);
      const { event, say } = par;

      const args = event.text.slice(1).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      console.log(cmd, args);
      if (cmd == "eval") {
        try {
          // Evaluate (execute) our input
          const evaled = await new Promise(async (_res, rej) => {
            let resolved = false;
            const res = (...args) => {
              resolved = true;
              _res(...args);
            };
            try {
              const exec = await eval(args.join(" "));
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
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
