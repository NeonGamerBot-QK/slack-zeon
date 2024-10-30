import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class nextDnsBTN implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `start-nextdns-instance`;
    this.description = `nextdns`;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.action(this.name, async (par) => {
      if (par.ack) await par.ack();
      if (par.body.user.id !== process.env.MY_USER_ID) return;
      //@ts-ignore
      console.log(par.body, par.event)
    });
  }
}
