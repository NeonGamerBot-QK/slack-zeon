import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class IconLogger implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = "team_profile_change";
    this.description = `new icon??`;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.event(this.name, async ({ event }) => {
        console.debug(event);
        // try {
            //@ts-ignore
            const { profile } = event;
            if (profile && profile.icon) {
                await app.client.chat.postMessage({
                    channel: `C08AUQ4AZL5`,
                    text: `:tada: New icon! ${profile.icon}`,
                });
            }

    });
  }
}
