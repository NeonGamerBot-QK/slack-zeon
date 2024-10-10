//

import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class AutoJoinChannel implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `channel_created`;
    this.description = `Channel creation - auto join`;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.event(this.name, async ({ event, say }) => {
      console.debug(event, "#channel_create");
      app.client.conversations.join({
        //@ts-ignore TODO: fix error later
        channel: event.channel.id,
      });
    });
  }
}
