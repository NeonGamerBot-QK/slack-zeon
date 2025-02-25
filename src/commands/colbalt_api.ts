// imagine you wanan see a video i send but you dont have tiktok
// well guess what zeon will auto send the video as an mp4 file

// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import FormData from "form-data";
export default class Message implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `Handles message based on colbalts link`;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      //   if (!par.ack) return;
      //   console.debug(0);
      if (!par.say) return;
      // console.log(
      //   `uh one of them are here`,
      //   par.event.text,
      //   par.event.channel_type,
      // );
      //@ts-ignore
      //   await par.ack();
      if (par.event.channel !== "C07R8DYAZMM") return;

      const { event, say } = par;
      if (event.text.includes("https://www.tiktok.com/t/")) {
        // slack cursed urls
        let url = event.text.split("<")[1].split(">")[0];
        console.log(event.text, url);

        fetch("https://cobalt.saahild.com/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            url: url,
          }),
        })
          .then((d) => d.json())
          .then((data) => {
            console.debug(data);
            if (!data.url) {
              app.client.chat.postMessage({
                channel: event.channel,
                text: `No url found. Please use https://cobalt.tools/ to watch this :D`,
                thread_ts: event.ts,
              });
              return;
            }
            app.utils.hackclubcdn.uploadURL([data.url]).then((uploadedURL) => {
              console.log(uploadedURL);
              app.client.chat.postMessage({
                channel: event.channel,
                // text: data.url,
                thread_ts: event.ts,
                reply_broadcast: true,
                unfurl_media: true,
                unfurl_links: true,
                text: `For does who know :skull::skull::skull: :\n> ${uploadedURL[0]} `,
              });
            });

            // fetch(data.url)
            //   .then((r) => r.arrayBuffer())
            //   .then((fd) => {
            //     const formData = new FormData();
            //     formData.append("file", Buffer.from(fd));
            //     fetch("https://cdn.saahild.com/api/upload", {
            //       method: "POST",
            //       headers: {
            //         Authorization: process.env.CDN_AUTH,
            //         Embed: "true",
            //         "No-JSON": "true",
            //         "Expires-At": "7d",
            //         ...formData.getHeaders(), // This will include the correct 'Content-Type' header with boundary
            //       },
            //       body: formData,
            //       // send the file as a multipart/form-data
            //     })
            //       .then((r) => r.text())
            //       .then((url) => {
            //         console.log(url);
            //         app.client.chat.postMessage({
            //           channel: event.channel,
            //           // text: data.url,
            //           thread_ts: event.ts,
            //           reply_broadcast: true,
            //           unfurl_media: true,
            //           unfurl_links: true,
            //           text: `For does who know :skull::skull::skull: :\n> ${url} `,
            //         });
            //       });
            // });
          });
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
