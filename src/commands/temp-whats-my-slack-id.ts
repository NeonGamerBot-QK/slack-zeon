// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
const id_regex =
  /<@[A-Za-z0-9]+>|<#([A-Za-z]+([0-9]+[A-Za-z]+)+)\|>|<#[A-Za-z0-9]+\|>/g;

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
    console.debug(`#message-radar`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel !== "C0159TSJVH8") return;
      const message = par;
      const { event, say } = par;

      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;
      if (app.disable_wmi) return;
      if (par.event.user == "UPJ04PRKJ") {
        app.disable_wmi = true;
        app.client.chat.postMessage({
          channel: "C07LGLUTNH2",
          text: "<@UPJ04PRKJ> is back",
        });
        return;
      }
      if (event.thread_ts) return;
      //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);

      const matchedText = event.text.match(id_regex) || [];
      // console.log(cmd, args);
      const ids = [...new Set([...matchedText, `<@${event.user}>`])];
      await app.client.chat.postMessage({
        channel: event.channel,
        text: `${ids.map((e) => `${e}: ${e.split("<")[1].split(">")[0].replace("@", "").replace("#", "").replace("|", "")}`).join("\n")}\n (this will be disabled once radar is back up)`,
        thread_ts: event.ts,
      });
      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
