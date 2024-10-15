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
      //@ts-ignore
      if (!event.channel) return;
      //@ts-expect-error
      if (!onlyForMe(event.channel.creator)) return;
      await app.client.conversations.join({
        //@ts-ignore TODO: fix error later
        channel: event?.channel.id,
      });
      await app.client.chat.postMessage({
        //@ts-ignore
        channel: event.channel.id,
        //@ts-ignore
        text: `Wsp <#${event.channel.id}>`,
      });
    });
  }
};
