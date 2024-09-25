// @ts-nocheck
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

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
        console.debug(0)
        if (!par.say) return;
        console.log(`uh one of them are here`,par.event.text, par.event.channel_type)
      //@ts-ignore
    //   await par.ack();
      if (par.event.channel_type !== "im") return;
        if (!par.event.text.startsWith("!")) return;
        console.debug(`cmd`)
      const { event, say } = par;

      const args = event.text.slice(1).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      console.log(cmd, args);
      if (cmd == "eval") {
      } else if (cmd == "hello") {
        say(`Whats up`);
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
