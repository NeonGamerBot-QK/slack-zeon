// welcome to starting your journey with an easy task
// in this file there are 3 parts of the first flag.
// have fun finding them.
// here is the first part
//  d9b0ecc6
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class CTF implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/capture-the-flag`;
    this.description = `Capture the flag??`;
  }
  run(app: App) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(
          `hint: check my source code :D\n ${process.env.SECOND_FLAG}`,
        );

      respond(`Super def secret part: 92bf-a969b0eb15c0`).then((d) => {});
    });
  }
}
