import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
export default class UUID implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `binn`;
    this.is_event = true;
  }
  run(app: App) {
    console.debug(`#message-bin`);
    // app.command()
    app.event(this.name, async (par) => {
      //@ts-ignore
      if (par.event.channel !== "C07LGLUTNH2") return;
      const message = par;
      //@ts-ignore
      //   if (par.event.thread_ts) return;

      console.debug(`cmd`);
      const { event, say } = par;
      // roll the dice!
      if (
      //@ts-ignore
        !event.text.toLowerCase().startsWith("```") ||
      //@ts-ignore
        !event.text.toLowerCase().endsWith("```")
      ) {
        await app.client.chat.postEphemeral({
          text: `:x: You need to use code blocks for this command.`,
          //@ts-ignore
          channel: event.channel,
          //@ts-ignore
          user: event.user,
        });
        return;
      }
      //@ts-ignore
      const contentToUpload = event.text.replace(/```[\s\S]*?```/, "");
      //@ts-ignore
      const bin = await fetch(" https://bin.saahild.com/documents", {
        method: "POST",
        body: contentToUpload,
      })
        .then((r) => r.json())
        .then((r) => r.key);
      await app.client.chat.postMessage({
        //@ts-ignore
        text: `<@${event.user}> Here is your bin link :P\n> https://bin.saahild.com/${bin}`,
        //@ts-ignore
        channel: event.channel,
        //@ts-ignore
        thread_ts: event.ts!,
      });

      console.debug(`#message-`);
    });
  }
}
