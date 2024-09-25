import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class Ping implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `app_mention`;
    this.description = `Pings zeon`;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.event(this.name, async ({ event, say }) => {
      console.debug(event, "#mention");
      //@ts-ignore
      if (!onlyForMe(command.user_id))
        await say(
          `Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`,
        );
      else
        await say(
          `<@U07L45W79E1> get back to coding me my ping code works fine...`,
        );
    });
  }
}
