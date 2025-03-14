//@ts-nocheck
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { banned_users } from "./joinchannel";
import { ModifiedApp } from "../modules/slackapp";

export default class UserJoinSlackEvent implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `team_join`;
    this.description = `User joins slack `;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.event(this.name, async ({ event, say, body }) => {
      console.debug(event, "#userjoinslack");
      //@ts-ignore
        app.client.chat.postMessage({
            text: JSON.stringify(event),
            channel: "#zeon-public"
    })
    });
  }
}
