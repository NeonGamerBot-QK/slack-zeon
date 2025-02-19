//@ts-nocheck
import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

const dev_ch_id = "C083C2ABX4K";
export default class UserJoinEvent implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `member_joined_channel`;
    this.description = `User no join channel `;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    let prod_channel_id = null;
    // app.command()
    app.event(this.name, async ({ event, say }) => {
      console.debug(event, "#userjoin");
      //@ts-ignore
      const { user, channel } = event;
     
        if (event.channel !== "C08ELF4UK96") return;
      try {

      //@ts-ignore
      await app.client.conversations.kick({
        channel: channel,
        user: user,
      });
      //@ts-ignore
      await app.client.chat.postMessage({
        //@ts-ignore
        channel,
        //@ts-ignore
        text: `You cant join <@${user}>`,
      });
      } catch (e) {
      //@ts-ignore
      await app.client.chat.postMessage({
        //@ts-ignore
        channel,
        //@ts-ignore
        text: `You are here for now <@${user}>`,
      });
      }

    });
  }
}
