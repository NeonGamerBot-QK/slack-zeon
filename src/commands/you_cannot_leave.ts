//@ts-nocheck
import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

const dev_ch_id = "C083C2ABX4K";
export default class UserJoinEvent implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `member_left_channel`;
    this.description = `User no leave channel `;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.event(this.name, async ({ event, say }) => {
      return;
      console.debug(event, "#userleave");
      //@ts-ignore
      const { user, channel } = event;
      const channelInfo = await app.client.conversations.info({
        channel: channel,
      });

      const channelName = channelInfo.channel.name;
      //@ts-ignore
      if (
        event.channel !== dev_ch_id &&
        channelName !== "you-cannot-leave-this-channel"
      )
        return;

      //@ts-ignore
      await app.client.conversations.invite({
        channel: channel,
        users: user,
      });
      //@ts-ignore
      await app.client.chat.postMessage({
        //@ts-ignore
        channel,
        //@ts-ignore
        text: `You cant escape <@${user}>`,
      });
    });
  }
}
