import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/check-idv`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();

      const input = command.text.trim() || `<@${command.user_id}>`
    const isSlackId = (input.startsWith("<@") || input.startsWith("U")) && input.length > 10
const idtStatus = await         fetch("https://identity.hackclub.com/api/external/check"+ (isSlackId ? `?slack_id=${input.replace("<@", "").replace(">", "")}` : `?email=${encodeURIComponent(input)}`)).then(r=>r.json()).then(d=>d.result)
await respond({
    response_type: "ephemeral",
    text: `*${input}* is *${idtStatus}*`
})
      try {
             await app.logsnag.track({
        channel: "idv-check",
        event: "usage",
        user_id: command.user_id,
        icon: "📜",
        description: "checked verification status",
                tags: {
                    status: idtStatus
                }
      });
      } catch (e) {
       console.error('idv stat log error', e) 
      }
    });
  }
}
