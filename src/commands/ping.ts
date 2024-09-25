import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/ping`;
    this.description = `Pings zeon`;
  }
  run(app: App) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(`:x: You cannot use this command.`);

      respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
        console.debug(`after ping`, d);
      });
    });
  }
}
