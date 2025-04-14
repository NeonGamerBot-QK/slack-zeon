import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class ChannelPing implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/zchannel`;
    this.description = `Pings @channel`;
  }
  run(app: ModifiedApp) {
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(`:x: You cannot use this command.`);
      const user = await app.client.users.info({ user: command.user_id });
      const displayName =
        user?.user?.profile?.display_name || user?.user?.name || "<unknown>";
      const avatar =
        user?.user?.profile?.image_original || user?.user?.profile?.image_512;
    
      const payload = {
        text: command.text,
        username: displayName,
        icon_url: avatar,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: command.text,
            },
          },
        ],
      };
    
      const response = await app.client.chat.postMessage({
        channel: command.channel_id,
        ...payload,
      });
    });
  }
}
