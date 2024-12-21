import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import ms from "ms";
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
      const args = command.text.split(" ");
      const subcmd = args.shift();
      let d = app.db.get("git_session") || [];
      switch (subcmd) {
        case "start":
          const reponame = args[0];
          if(!reponame) {
            respond(`:x: You need to provide a repo name.`);
            return;
          }
          // app.client.chat.postMessage({
          //   channel: command.channel_id,
          //   text: `Starting Code Watcher for ${reponame}`,
          // });
          // create a new session
          const session = {
            active: true,
            repo: reponame,
            channel: command.channel_id,
            started_at: Date.now(),
            ended_at: null,
            message_ts: null,
            mlink: null,
          };

          app.client.chat
            .postMessage({
              channel: command.channel_id,
              user: command.user_id,
              text: `Starting Code Watcher for ${reponame}`,
            })
            .then(async (dr) => {
              session.message_ts = dr.ts;
              session.mlink = await app.client.chat
                .getPermalink({
                  channel: dr.channel,
                  message_ts: dr.ts,
                })
                .then((d) => d.permalink);
              d.push(session);
              app.db.set("git_session", d);
            });
          break;
        case "stop":
          // let d = app.db.get("git_session") || [];
          if (!d[d.indexOf(d.find((e) => e.active))]) {
            app.client.chat.postEphemeral({
              channel: command.channel_id,
              user: command.user_id,
              text: `No session atm`,
            });
            return;
          }
          // d = d.filter(e=>e.active);
          d[d.indexOf(d.find((e) => e.active))].ended_at = Date.now();
          await app.client.chat.postMessage({
            channel: command.channel_id,
            thread_ts: d[d.indexOf(d.find((e) => e.active))].message_ts,
            text: `Stopping Code Watcher, Took ${ms(d[d.indexOf(d.find((e) => e.active))].ended_at - d[d.indexOf(d.find((e) => e.active))].started_at)}`,
          });
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
