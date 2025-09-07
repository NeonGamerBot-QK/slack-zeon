import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { emoji_react_list } from "./funny_msg";
import ms from "ms";
import { ModifiedApp } from "../modules/slackapp";
const queueForAfk = new Set();
export default class HowWasUrDayMessage implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `If message matches 'today' il react & add it to db`;
    this.is_event = true;
  }
  async starMessage(app: ModifiedApp, event) {
    if (!event.text) return;
    const tokens = [
      process.env.SLACK_USER_TOKEN,
      process.env.SLACK_BOT_TOKEN,
      ...(app.db.get("slack_reaction_tokens") || []),
    ];
    for (const t of tokens) {
      try {
        console.log("star");
        await app.client.reactions.add({
          channel: event.channel,
          timestamp: event.ts,
          name: "star",
          token: t,
        });
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        console.error(e);
      }
    }
  }
  async userTags(app: ModifiedApp, event) {
    const user = event.user;
    // console.log(user, "zt");
    if (user !== process.env.MY_USER_ID) return;
    if (!event.text.startsWith("!zt")) return;
    const tag = event.text.split(" ")[1];
    // console.log(tag);
    const tagContent = await app.dbs.tags.get(`${event.user}_${tag}`);

    if (tagContent) {
      //edit my msg
      await app.client.chat.update({
        channel: event.channel,
        ts: event.ts,
        thread_ts: event.thread_ts,
        text: `:label: ${tagContent}`,
        token: process.env.SLACK_USER_TOKEN,
      });
    } else {
      // TODO: create tag if more text.. otherwise js say 404
      // if() {
      //   // create ta
      // }    // if() {
      //   // create ta
      // }
    }
  }
  async potatoGame(app: ModifiedApp, event) {
    const pg = app.db.get("potato_game");
    // console.log(pg, event.text, event.thread_ts);
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
        } catch (e) { }
      } else if (
        event.text.toLowerCase().trim() == "no! i love the potatos!!"
      ) {
        try {
          app.client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "no",
          });
        } catch (e) { }
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
        users_who_participated: [
          ...new Set([...(pg.users_who_participated || []), event.user]),
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
        let usersWhoHaveOne = pg.users_who_participated;
        const usersInTHeChannel = await app.client.conversations.members({
          channel: process.env.POTATO_CHANNEL,
        });
        usersWhoHaveOne = usersWhoHaveOne.filter(
          (e) => !usersInTHeChannel.members.includes(e),
        );
        const randomUser =
          usersWhoHaveOne[Math.floor(Math.random() * usersWhoHaveOne.length)];
        await app.client.conversations.invite({
          channel: process.env.POTATO_CHANNEL,
          users: randomUser,
        });
        //delete it all now
        app.db.delete("potato_game");
      }
    }
  }
  async handleAfk(app: ModifiedApp, event) {
    if (event.channel == "D07LBMXD9FF") return;
    const send_to_channel = [`C07LEEB50KD`, `C07R8DYAZMM`];
    const amIAfkRn = app.db.get("neon_afk");
    if (amIAfkRn && event.user == process.env.MY_USER_ID) {
      app.db.delete("neon_afk");
      app.client.chat.postMessage({
        channel: event.user,
        text: `Welcome back from being afk from: ${amIAfkRn} - you can now be pinged again!`,
      });
      return;
    }
    if (!amIAfkRn) return;
    if (!event.text) return;
    const mentioned =
      event.text.includes("<@U07L45W79E1>") ||
      event.text.toLowerCase().includes(" neon ");

    const isDM = event.channel.startsWith("D");

    if (!mentioned && !isDM) {
      return;
    }
    if (queueForAfk.has(event.user)) {
      // ignore;
      console.debug(`already in queue for afk`);
      return;
    }
    queueForAfk.add(event.user);
    setTimeout(
      () => {
        queueForAfk.delete(event.user);
      },
      1000 * 60 * 5,
    ); // 5 minutes
    // try to react as zeon
    try {
      await app.client.reactions.add({
        channel: event.channel,
        timestamp: event.ts,
        name: "afk",
        // token: process.env.SLACK_USER_TOKEN,
      });
    } catch (e) { }
    // send the a pm from zeons side unless this is my channel lmao
    app.client.chat.postMessage({
      channel: send_to_channel.includes(event.channel)
        ? event.channel
        : event.user,
      text: `Hey there <@${event.user}>, @Neon is currently afk for: ${amIAfkRn}, please do not ping them in the meantime - they will get back to you!`,
    });
    // log it into priv channel
    app.client.chat.postMessage({
      channel: `C07LGLUTNH2`,
      text: `Hey there <@${event.user}>, @Neon is currently afk for: ${amIAfkRn}, please do not ping them in the meantime - they will get back to you! - ${await app.client.chat
        .getPermalink({
          channel: event.channel,
          message_ts: event.ts,
        })
        .then((d) => d.permalink)}`,
    });
  }
  run(app: ModifiedApp) {
    console.debug(`#message-hwowasurday`);
    // app.command()
    app.event(this.name, async (par) => {
      try {
        this.potatoGame(app, par.event);
      } catch (e) { } //  console.debug(par);
      try {
        this.userTags(app, par.event);
      } catch (e) { } //  console.debug(par)
      try {
        this.handleAfk(app, par.event);
      } catch (e) {
        console.error(e, "afk");
      }
      //@ts-ignore
      if (par.event.channel == "C08RG05HYHM") this.starMessage(app, par.event);

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
      if (
        //@ts-ignore
        par.event.text.toLowerCase().includes("today i") &&
        //@ts-ignore
        par.event.channel == "C07R8DYAZMM"
      ) {
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
            } catch (e) { }
          }
        }
      }
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
