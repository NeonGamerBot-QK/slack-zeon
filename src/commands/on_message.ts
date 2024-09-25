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
     console.debug(par);
        console.debug(`#message-`);
        const { event, say } = par;
      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
