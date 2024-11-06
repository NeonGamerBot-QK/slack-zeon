import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class codewatcher implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/codewatcher`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(`:x: You cannot use this command.`);

      const subcmd = command.text.split(" ")[1];
      switch (subcmd) {
        case "start":
          app.client.chat.postMessage({
            channel: command.channel_id,
            text: `Starting Code Watcher`,
          });
          break;
        case "stop":
          let d = app.db.get("git_session") || [];
          // d = d.filter(e=>e.active);
          d[d.indexOf(d.find((e) => e.active))].active = false;
          app.db.set("git_session", d);
          app.client.chat.postEphemeral({
            channel: command.channel_id,
            user: command.user_id,
            text: `Stopping Code Watcher`,
          });
          break;
        default:
          respond(`Unknown subcmd \`${subcmd}\``);
          break;
      }
    });
  }
}
