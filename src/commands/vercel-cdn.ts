// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class VercelCDN implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `If message matches 'today' il react & add it to db`;
    this.is_event = true;
  }
  run(app: App) {
    console.debug(`#message-cdn`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel !== "C08EJR20WCC") return;
      const message = par;
      const { event, say } = par;

      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;
    //   if (app.disable_wmi) return;
       //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd upload`);
      if (event.files && event.files.length > 0) {
        // event.files.forEach((file) => {
        //     console.log(`File Name: ${file.name}`);
        //     console.log(`Download URL: ${file.url_private}`); // Private URL requires authentication
        // });
        await app.client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "beachball",
        })
        const urls = []
        for(const file of event.files) {
            const url = file.url_private;
            urls.push(url)
        }
        const cdnUrls = await app.utils.hackclubcdn.uploadURL(urls)
        await app.client.chat.postMessage({
            channel: event.channel,
            thread_ts: event.ts,
            text: `:white_check_mark: <@${event.user}> Uploaded to cdn!\n> ${cdnUrls.join("\n> ")}`,
            unfurl_links: false,
            unfurl_media: false,
            // user: event.user,
        });
        await Promise.all([app.client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "white_check_mark",
        }), app.client.reactions.remove({
            channel: event.channel,
            timestamp: event.ts,
            name: "beachball",
        })])
    }
      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
