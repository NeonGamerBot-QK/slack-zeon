// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { buildBoard, getRandomWord, onGuess } from "../modules/hangman";
export default class HowWasUrDayMessage implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `rate them ships`;
    this.is_event = true;
  }
  run(app: App) {
    console.debug(`#message-hwowasurday`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel !== "C08358F9XU6") return;
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
      if (!onlyForMe(par.event.user)) return;
      //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);
      const { event, say } = par;
      let giturl = event.text
        .trim()
        .split(/ +/)
        .find((e) => e.match(/^https:\/\/github\.com(?:\/[^\s\/]+){2}$/));
      if (!giturl) {
        await app.client.chat.postEphemeral({
          user: event.user,
          channel: event.channel,
          text: `Maybe add a git url?? (i only run on github.com srry)`,
          thread_ts: event.ts,
        });
        return;
      }
      const [username, reponame] = giturl.split(/\//).slice(-2);
      console.debug(username, reponame);
      const rdata = await fetch(
        `https://api.github.com/repos/${username}/${reponame}`,
      );
      if (rdata.status == 404) {
        await app.client.chat.postEphemeral({
          user: event.user,
          channel: event.channel,
          text: `Repo not found`,
          thread_ts: event.ts,
        });
        return;
      }
      const errors = [];
      const rrdata = await rdata.json();
      const hasLicense = rrdata.license;
      const isBrokenOrArchived = rrdata.archived || rrdata.disabled;
      const repoDescrition = rrdata.description || "";
      const demoURL = rrdata.homepage;
      if (!hasLicense) errors.push(`No license`);
      if (isBrokenOrArchived) errors.push(`Broken or archived`);
      if (repoDescrition.length < 10)
        errors.push(`Repo description is too short`);
      if (!demoURL) errors.push(`No demo url`);

      if (errors.length > 0) {
        await app.client.chat.postMessage({
          user: event.user,
          channel: event.channel,
          text: `Feedback:\n- ${errors.join("\n- ")}`,
          thread_ts: event.ts,
        });
        return;
      }
      // app.client.chat.postMessage({
      //   channel: event.channel,
      //   text: `:hangman: hangman is def starting and this isnt a placeholder message :p`,
      // });
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
