import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { createShipmentURL } from "../modules/parseShipments";
import { ModifiedApp } from "../modules/slackapp";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/zeon-hackclub-shipments`;
    this.description = `add your shipment url so zeon can scarpe them`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();


      // respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
      //   console.debug(`after ping`, d);
      // });
        const shipmentURL = command.text
        if (!shipmentURL) return respond(`:x: You need to provide a shipment url.`);
        const parse = new URLSearchParams(shipmentURL)
        const properURL = createShipmentURL(parse.get(`signature`), parse.get(`email`))
        await app.db.set(`shipment_url_${command.user_id}`, properURL)
        respond(`:white_check_mark: Shipment URL was set! check the app home to see ur packages`)
    });
  }
}
