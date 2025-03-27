import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { emoji_react_list } from "./funny_msg";
import ms from "ms";
import { ModifiedApp } from "../modules/slackapp";
export default class HowWasUrDayMessage implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `If message matches 'today' il react & add it to db`;
    this.is_event = true;
  }
  potatoGame(app: ModifiedApp, event) {
    const pg = app.db.get("potato_game");
    console.log(pg, event.text, event.thread_ts);
    if (!pg) return;
    console.log(1);
    let valid_attack = false;
    if (pg.ts == event.thread_ts || pg.last_cmd == event.thread_ts) {
      if (
        event.text
          .toLowerCase()
          .trim()
          .includes("defend against the rouge potatoe")
      ) {
        // react with potato
        try {
          app.client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "potato",
          });
          valid_attack = true;
        } catch (e) {
          app.client.chat.postEphemeral({
            text: `:x: Failed to react with potato!`,
            channel: event.channel,
            user: event.user,
          });
        }
      } else if (event.text.toLowerCase().trim() == "fuck this") {
        try {
          app.client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "fuck",
          });
        } catch (e) {}
      } else if (
        event.text.toLowerCase().trim() == "no! i love the potatos!!"
      ) {
        try {
          app.client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "no",
          });
        } catch (e) {}
        app.client.chat.postMessage({
          text: `No!! i will go against the potatoes!!`,
          channel: event.channel,
          thread_ts: event.ts,
        });
      }
      app.db.set("potato_game", {
        ...pg, 
        total_cmd_count: pg.total_cmd_count + 1,
        last_cmd: event.ts,
        users_who_participated: [...new Set(
          ...(pg.users_who_participated || []),
          event.user)
        ].filter(Boolean),
        valid_attacks_count: pg.valid_attacks_count + (valid_attack ? 1 : 0),
      });
      if (pg.total_cmd_count >= 5 && pg.users_who_participated.length >= 4) {
        console.log(`Bye bye!`);
        app.client.chat.postMessage({
          text: `:tada: Congrats! You have defended against the rouge potatoes attacking with ${pg.valid_attacks_count}/${pg.total_cmd_count} (valid/total)! :tada:\nThanks to <@${pg.users_who_participated.join(">, <@")}> for participating!\n> raid took ${ms(Date.now() - pg.created_at)} to complete!`,
          channel: event.channel,
          thread_ts: event.ts,
          reply_broadcast: true,
        });
        //delete it all now
        app.db.delete("potato_game");
      }
    }
  }
  run(app: ModifiedApp) {
    console.debug(`#message-hwowasurday`);
    // app.command()
    app.event(this.name, async (par) => {
      this.potatoGame(app, par.event);
      //  console.debug(par);
      //@ts-ignore

      if (par.event.channel == "C07ST3FF4S0") return;
      const message = par;
      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;
      //@ts-ignore
      if (par.event.hidden) return;
      //@ts-ignore
      if (!par.event.thread_ts) return;

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
      //@ts-ignore
      const args = event.text.trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      // console.log(cmd, args);
      //@ts-ignore
      if (par.event.text.toLowerCase().includes("today i")) {
        const link = await app.client.chat
          .getPermalink({
            //@ts-ignore

            message_ts: message.event.ts,
            //@ts-ignore

            channel: message.event.channel,
          })
          .then((d) => d.permalink);
        app.db.set("howday_last_message_link", link);
        app.client.reactions.add({
          //@ts-ignore

          channel: message.event.channel,
          //@ts-ignore

          timestamp: message.event.ts,
          name: "yay",
        });
        for (const e of emoji_react_list) {
          //@ts-ignore

          if (par.event.text.toLowerCase().includes(e.keyword.toLowerCase())) {
            try {
              await app.client.reactions.add({
                //@ts-ignore

                channel: par.event.channel,
                //@ts-ignore
                timestamp: par.event.ts,

                name: e.emoji,
              });
            } catch (e) {}
          }
        }
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
