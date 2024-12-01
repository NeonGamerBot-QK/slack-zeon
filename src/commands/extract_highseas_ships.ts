// @ts-nocheck
import { App } from "@slack/bolt";
import { ModifiedApp } from "../modules/slackapp";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
// example str
// *PySoundboard*\nBy <@U0827CL509G> | <https://github.com/UnstoppableBlob/PySoundboard|Repo> | <https://www.youtube.com/watch?v=6aCpx02h738|Demo>\nMade in 0 hours

const extractInfo = (input) => {
  const idMatch = input.match(/<@(\w+)>/); // Matches the ID pattern
  const gitMatch = input.match(/<([^|]+)\|Repo>/); // Matches the GitHub URL (without relying on domain)
  const demoMatch = input.match(/<([^|]+)\|Demo>/); // Matches the Demo URL (without relying on domain)
  const hoursMatch = input.match(/Made in (\d+) hours/); // Matches the hours information

  return {
    userId: idMatch ? idMatch[1] : null,
    git: gitMatch ? gitMatch[1] : null, // Get the URL without the '<>' symbols
    demo: demoMatch ? demoMatch[1] : null, // Get the URL without the '<>' symbols
    hourCount: hoursMatch ? parseInt(hoursMatch[1], 10) : null,
  };
};

export default class HighSeasShipExtractor implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `high seas ships yum yum`;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    // console.debug(`#message-hwowasurday`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel !== "C07UA18MXBJ") return;
      if (par.event.user !== "U07NGBJUDRD") return;
      const message = par;
      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;
      if (par.event.hidden) return;

      // console.log(
      //   `uh one of them are here ffs`,
      //   par.event,
      //   par.event.channel_type,
      // );
      //@ts-ignore
      //   await par.ack();
      //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);
      const { event, say } = par;

      const args = event.text.trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      // console.log(cmd, args);
      const blocks = par.event.blocks;
      const textEl = blocks[0].text.text;
      const info = extractInfo(textEl);
      console.log(info);
      // debug it
      await app.client.chat.postMessage({
        channel: `C07LGLUTNH2`,
        text: `${JSON.stringify(info)}\n\n I GOT THE SHIP MAYBE`,
        // blocks,
      });
      // userid most importent because it is what the thingy ac uses.
      if (!info.userId) return;
      fetch(`https://api.saahild.com/api/highseasships/add_ships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${process.env.AUTH}`,
        },
        body: JSON.stringify(info),
      });

      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
