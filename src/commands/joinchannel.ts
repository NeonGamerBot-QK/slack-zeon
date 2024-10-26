import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/joinneonschannel`;
    this.description = `Join Neons channel`;
  }
  run(app: App) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
    //   const stamp = Date.now();
      await ack();

      if (onlyForMe(command.user_id))
            return respond(`:x: you are the channel owner.`);
        app.client.conversations.invite({
            channel: "C07R8DYAZMM",
            users: command.user_id
      })
    });
  }
}
