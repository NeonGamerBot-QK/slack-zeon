//

import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class UserJoinEvent implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `member_joined_channel`;
    this.description = `User joins Channel `;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.event(this.name, async ({ event, say }) => {
      console.debug(event, "#userjoin");
      //@ts-ignore
if(event.channel !== "C07R8DYAZMM") return;
      await app.client.chat.postMessage({
        //@ts-ignore
        channel: event.channel,
        //@ts-ignore
        text: `Wsp <@${event.user}>`,
      });
    });
  }
}
