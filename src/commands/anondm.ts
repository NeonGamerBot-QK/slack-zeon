import { App, SlackAction } from "@slack/bolt";
import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
export default class AnonDM implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `anondmfuncs`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    app.action("send_mail", async (par) => {
      const { action, ack, respond } = par;
      await ack();
      console.debug(`#action`, par);
    });
  }
}
