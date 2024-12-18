// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
export default class HowWasUrDayMessage implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `personal channel tags:3`;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    console.debug(`#message-fnymsg`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel !== "C07R8DYAZMM") return;
      const message = par;
      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;

      // console.log(
      //   `uh one of them are here ffs`,
      //   par.event,
      //   par.event.channel_type,
      // );
      //@ts-ignore
      //   await par.ack();

      //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);
      if (par.event.text && par.event.text.length > 2000) {
        await app.client.chat.postMessage({
          channel: par.event.channel,
          text: `:notcool: holy yapperonie`,
          thread_ts: par.event.ts,
        });
      }
      if (
        par.event.text &
    par.event.text
          .split("")
          .map((e) => e.toUpperCase())
          .join("") ==
          par.event.text
      ) {
        await app.client.chat.postMessage({
          channel: par.event.channel,
          text: `Hey! why you yelling >:(`,
        });
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
