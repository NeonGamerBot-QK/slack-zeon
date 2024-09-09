import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class Ping implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `on_mention`;
    this.description = `Pings zeon`;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.event(this.name, async ({ event, say }) => {
      //@ts-ignore
      await say(`Pingy ping ping`);
    });
  }
}
