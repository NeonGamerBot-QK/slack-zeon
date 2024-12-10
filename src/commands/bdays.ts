import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/bday`;
    this.description = `Bday :D`;
  }
  run(app: App) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();

      // first make it store them
      // TODO
      const args = command.text.split(/ +/);
      const cmd = args.shift().toLowerCase();
      if (cmd == "config") {
      } else if (cmd == "remove-my-data") {
      }
    });
  }
}
