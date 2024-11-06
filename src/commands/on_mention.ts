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
      if (!say) return;
      //@ts-ignore
      if (!onlyForMe(event.user))
        await say({
          text: `Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`,
          //@ts-ignore
          thread_ts: event.ts,
        });
      else
        await say({
          text: `<@U07L45W79E1> get back to coding me my ping code works fine...`,
          //@ts-ignore
          thread_ts: event.ts,
        });
    });
  }
}
