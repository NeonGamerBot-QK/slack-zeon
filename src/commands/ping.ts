import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/ping`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(`:x: You cannot use this command.`);

      const sentStamp = Date.now();
      app.client.chat
        .postMessage({
          text: `pinging...`,
          channel: command.channel_id,
        })
        .then((d) => {
          app.client.chat.update({
            ts: d.ts,
            channel: command.channel_id,
            text: `Pong took: \`${Date.now() - sentStamp}ms\`\nUptime: \`${process.uptime()}\`s`,
          });
        });
    });
  }
}
