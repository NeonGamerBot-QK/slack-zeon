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
      if (par.event.thread_ts) return;
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
      console.log(event.text);
      let giturl = event.text
        // .trim()
        .replace("<", "")
        .replace(">", "")
        .split(/ +/)
        .find((e) => e.match(/^https:\/\/github\.com(?:\/[^\s\/]+){2}$/))
        ?.trim();
      console.log(giturl);
      if (!giturl) {
        await app.client.chat.postEphemeral({
          user: event.user,
          channel: event.channel,
          text: `Maybe add a git url?? (i only run on github.com srry)`,
          //   thread_ts: event.ts,
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
          //   thread_ts: event.ts,
        });
        return;
      }
      const errors = [];
      const rrdata = await rdata.json();
      const hasLicense = rrdata.license;
      const isBrokenOrArchived = rrdata.archived || rrdata.disabled;
      const repoDescrition = rrdata.description || "";
      const demoURL = rrdata.homepage;
      const isOlderThenHighSeas =
        new Date(rrdata.pushed_at).getTime() < 1730260800000;
      if (!hasLicense) errors.push(`No license`);
      if (isBrokenOrArchived) errors.push(`Broken or archived`);
      if (repoDescrition.length < 10)
        errors.push(`Repo description is too short`);
      if (!demoURL) errors.push(`No demo url`);
      if (isOlderThenHighSeas)
        errors.push(
          `Repo is older than high seas AND has not been pushed since before high seas`,
        );
      // now time for readme checks
      const readme = await fetch(
        `https://raw.githubusercontent.com/${username}/${reponame}/${rrdata.default_branch}/README.md`,
      );
      if (readme.status == 404) {
        errors.push(`No readme found`);
      } else {
        const readmeData = await readme.text();
        //TODO
      }
      if (errors.length > 0) {
        await app.client.chat.postMessage({
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
