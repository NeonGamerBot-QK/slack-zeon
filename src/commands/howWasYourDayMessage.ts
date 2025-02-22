// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { emoji_react_list } from "./funny_msg";
export default class HowWasUrDayMessage implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `If message matches 'today' il react & add it to db`;
    this.is_event = true;
  }
  run(app: App) {
    console.debug(`#message-hwowasurday`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel == "C07ST3FF4S0") return;
      const message = par;
      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;
      if (par.event.hidden) return;
      if (!par.event.thread_ts) return;

      // console.log(
      //   `uh one of them are here ffs`,
      //   par.event,
      //   par.event.channel_type,
      // );
      //@ts-ignore
      //   await par.ack();
      if (!onlyForMe(par.event.user)) return;
      //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);
      const { event, say } = par;

      const args = event.text.trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      // console.log(cmd, args);

      if (par.event.text.toLowerCase().includes("today i")) {
        const link = await app.client.chat
          .getPermalink({
            message_ts: message.event.ts,
            channel: message.event.channel,
          })
          .then((d) => d.permalink);
        app.db.set("howday_last_message_link", link);
        app.client.reactions.add({
          channel: message.event.channel,
          timestamp: message.event.ts,
          name: "yay",
        });
        for (const e of emoji_react_list) {
          if (par.event.text.toLowerCase().includes(e.keyword.toLowerCase())) {
            try {
              await app.client.reactions.add({
                channel: par.event.channel,
                timestamp: par.event.ts,
                name: e.emoji,
              });
            } catch (e) {}
          }
        }
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
