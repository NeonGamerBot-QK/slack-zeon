import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { createShipmentURL } from "../modules/parseShipments";
import { ModifiedApp } from "../modules/slackapp";

export default class ZeonShipPkgs implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/zeon-hackclub-shipments`;
    this.description = `add your shipment url so zeon can scarpe them`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      respond(`Use postpuppy!`);
    });
  }
}
