import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
export default class UUID implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `d20`;
    this.is_event = true;
  }
  run(app: App) {
    console.debug(`#message-uuid`);
    // app.command()
    app.event(this.name, async (par) => {
      //@ts-ignore
      if (par.event.channel !== "C07LGLUTNH2") return;
      const message = par;
      //@ts-ignore
      if (par.event.thread_ts) return;

      console.debug(`cmd`);
      const { event, say } = par;
      // roll the dice!
      //@ts-ignore
if(!event.text.toLowerCase().startsWith("gib uuid")) return;
const uuid = require("uuid");
const roll = uuid.v4();
await app.client.chat.postMessage({
    text: `uuid: \`${roll}\``, 
    //@ts-ignore
    channel: event.channel,
    //@ts-ignore
    thread_ts: event.ts!,
})

      console.debug(`#message-`);
    });
  }
}
