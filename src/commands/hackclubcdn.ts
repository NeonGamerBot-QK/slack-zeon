import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/zeon-hc-cdn`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      // respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
      //   console.debug(`after ping`, d);
      // });
      const cdnUrl = command.text;
      if (!cdnUrl) return respond(`:x: You need to provide a cdn url.`);

      const result = await app.utils.hackclubcdn.uploadURL(cdnUrl);
      app.client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:white_check_mark: Uploaded to cdn! ${result.url}`,
      });
    });
  }
}
