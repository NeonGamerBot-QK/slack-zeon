// how was your day reader?
// anyways

import JSONdb from "simple-json-db";
import { ModifiedApp } from "./slackapp";
import { getTodaysEvents } from "./hw";
import { GitBody, GitSession } from "./projectWaterydo";
import ms from "ms";
import { hacktime } from ".";
import { writeFileSync } from "fs";
import path from "path";
export let cached_spotify_songs = [];
export function resetSpotifyCache(app: ModifiedApp) {
  cached_spotify_songs = app.db.get("spotify_songs") || [];
}
export function diceDups(arr) {
  const r = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i - 1]) {
      if (arr[i] == arr[i - 1]) {
        // add it to an array
        continue;
      } else
        r.push({
          value: arr[i],
          count: 1,
        });
    } else {
      r.push(arr[i]);
    }
  }
  return r;
}

export async function getDayResponse(db: JSONdb) {
  const hw = await getTodaysEvents().then((e: any) => {
    const start = [];
    const end = [];
    //@ts-ignore
    e.forEach((e) => {
      if (e.assign_type == "start") start.push(e.summary);
      if (e.assign_type == "end") end.push(e.summary);
    });
    if (start.length > 0 || end.length > 0) {
      return `Assigned today:\n> ${start.join("\n> ")}\n*Due Today*\n> ${end.join("\n> ")}`;
    } else {
      return `No HW found :yay:`;
    }
  });
  const lastMessageLink =
    db.get("howday_last_message_link") ||
    "Wow this is the first one or i have not finished the code.";
  return `Well well <@${process.env.MY_USER_ID}> <${lastMessageLink}|how was your day>. either way heres some stuff about today.\n> Your hw:\n${hw}\n> Your todo list you want to share here\n> ${await fetch("https://raw.githubusercontent.com/NeonGamerBot-QK/public-my-notes/refs/heads/main/slack_channel/todo.md").then((r) => r.text())} `;
}
// @see https://stackoverflow.com/a/43837711
// export function makeSlackMessageUrl(channel: string, messageTs: number) {
//     const int=messageTs.toString().split('.')[0]
//     return `https://hackclub.slack.com/archives/${channel}/p${int}`
// }
/**
 *
 * @param app
 * @param filter
 * @deprecated
 */
export function listenForResponse(app: ModifiedApp, filter: any) {
  async function messageListener(message) {
    if (filter(message)) {
      const link = await app.client.chat
        .getPermalink({
          message_ts: message.event.ts,
          channel: message.event.channel,
        })
        .then((d) => d.permalink);
      app.db.set("howday_last_message_link", link);
      app.client.reactions.add({
        channel: message.event.channel,
        timestamp: message.event.ts,
        name: "thumbsup",
      });
    }
  }
  // TODO: find a way to stop the event after xyz time
  app.event("message", messageListener);
}
/**
 * @see https://github.com/SkyfallWasTaken/slack-activity-webhook/blob/main/index.ts
 */
export async function getMessageCount(db: JSONdb) {
  // js use the .env lmao

  const formData = new FormData();
  formData.append("token", process.env.SLACK_BROWSER_TOKEN);
  formData.append("module", "messages");
  formData.append("query", `from:<@${process.env.MY_USER_ID}> after:Yesterday`);
  formData.append("page", "1");

  const response = await fetch(
    `https://hackclub.slack.com/api/search.modules.messages`,
    {
      headers: {
        accept: "*/*",
        cookie: `d=${process.env.SLACK_USER_COOKIE}`,
      },
      body: formData,
      method: "POST",
    },
  );
  const data = await response.json();
  console.log(data);
  const messagesSent = data.pagination.total_count;
  console.log(`Messages sent: ${messagesSent}`);
  const messagesSentYesterday = (await db.get("messages_sent_yesterday")) || -1;
  console.log(`Messages sent yesterday: ${messagesSentYesterday}`);

  const difference =
    messagesSentYesterday !== undefined
      ? messagesSent - messagesSentYesterday
      : 0;

  const emoji = (() => {
    if (difference > 0) return ":chart_with_upwards_trend:";
    if (difference < 0) return ":chart_with_downwards_trend:";
    return ":chart_with_upwards_trend:";
  })();

  const differenceText = (() => {
    if (!difference) return "";
    const direction = difference > 0 ? "more" : "less";
    return ` _(${Math.abs(difference)} ${direction} than yesterday)_`;
  })();

  const message = `${emoji} <@${process.env.MY_USER_ID}> has sent *${messagesSent} messages* today.${differenceText}`;
  await db.set("messages_sent_yesterday", messagesSent);
  const messagesTotal = (await db.get("messages_total")) || [];
  messagesTotal.push(messagesSent);
  await db.set("messages_total", messagesTotal);
  return message;
}
function getMoneyEmoji(card: string) {
  switch (card) {
    case "chase":
      return ":rocket_chase_bank:";
      break;
    case "fidelity":
      return ":rocket_fidelity:";
      break;
    case "paypal":
      return ":rocket_paypal:";
      break;
    case "capitalone":
      return ":rocket_capital_one:";
      break;
  }
}
export async function getWalletBalance(app: ModifiedApp) {
  const walletData = await fetch(
    process.env.ZEON_DISCORD_INSTANCE + "/irl/transactions",
    {
      headers: {
        Authorization: process.env.IRL_AUTH,
      },
    },
  )
    .then((r) => r.json())
    .then((json) =>
      json.currentTransactions.filter((d) => {
        const f = new Date(d.created_at);
        const today = new Date();
        // check if less then 24h
        // return (
        //   Math.round((f.getTime() - today.getTime()) / 1000 / 60 / 60) < 24 &&
        //   Math.round((f.getTime() - today.getTime()) / 1000 / 60 / 60) > 0
        // );
        return (
          f.getDate() == today.getDate() &&
          f.getMonth() == today.getMonth() &&
          f.getFullYear() == today.getFullYear()
        );
      }),
    );
  return `${walletData.map((d) => `-${d.type == "rocket" ? getMoneyEmoji(d.card) : ":appleinc:"} - *${d.amount}* @ _${d.name}_`).join("\n")}`;
}
export default async function (app: ModifiedApp, channel = `C07R8DYAZMM`) {
  const db = app.db;
  const getStr = await getDayResponse(db);
  const mobj = await app.client.chat.postMessage({
    channel,
    text: getStr,
  });
const statusBar = await hacktime.getStatusBar();
  const formattedHacktimeResults = statusBar.projects.map((e) => `- *${e.name}*: \`${e.text}\``).join("\n");
  if (formattedHacktimeResults.length > 0) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `Here are your :wakatime-dark: hacktime stats for today:\n${formattedHacktimeResults}\n you also spent *${statusBar.human_readable_total}* time total on coding today :p`,
    });
  } else {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `No hacktime activity for today found...you didnt code.. AT ALL!`,
    });
  }
  const today = new Date();
  const codewatcherForToday = (
    (app.db.get("git_session") || []) as GitSession[]
  ).filter((d) => {
    const f = new Date(d.started_at);
    // check if less then 24h
    // return (
    //   Math.round((f.getTime() - today.getTime()) / 1000 / 60 / 60) < 24 &&
    //   Math.round((f.getTime() - today.getTime()) / 1000 / 60 / 60) > 0
    // );
    return (
      f.getDate() == today.getDate() &&
      f.getMonth() == today.getMonth() &&
      f.getFullYear() == today.getFullYear()
    );
  });
  const walletForToday = await getWalletBalance(app);
  if (walletForToday.length > 5) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `Here is your wallet transactions for today:\n${walletForToday}`,
    });
  } else {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `No wallet activity for today found...`,
    });
  }
  if (cached_spotify_songs.length > 0) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      //@ts-ignore
      text: `Here is what you listned to today :spotify_new: : \n- ${[...diceDups(cached_spotify_songs)].map((s) => (typeof s == "string" ? `${s} x ${cached_spotify_songs.filter((e) => e == s).length}` : `${s.value} x ${s.count}`)).join("\n- ")}\n\n`.replaceAll(
        ":spotify_new:",
        ":new_spotify:",
      ),
    });
    cached_spotify_songs = [];
    app.db.delete("spotify_songs");
  } else {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `No spotify activity for today found...`,
    });
  }
  if (codewatcherForToday.length > 0) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `Well well well it also looks like you were using codewatcher today\n${codewatcherForToday.some((d) => d.repo.includes("zeon")) ? "> and i see u worked on some of my code :D you better have not fucked me up\n" : ""}Anyways here are the projects you recorded:\n> ${codewatcherForToday.map((d) => `Project: ${d.repo} which was recorded in <#${d.channel}> and lasted for an for ${ms(Math.round((d.ended_at || Date.now()) - d.started_at))}  - [<https://github.com/NeonGamerBot-QK/${d.repo}|repo>], [<${d.mlink}|message link>]  `).join("\n> ")}`,
    });
  } else {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `No codewatcher activity for today found...`,
    });
  }
  await app.client.chat.postMessage({
    channel,
    thread_ts: mobj.ts,
    text: await getMessageCount(app.db),
  });
  if (
    app.db.get("messages_total") &&
    app.db.get("messages_total").length >= 7
  ) {
    // send weekly graph to channel
    sendWeeklyGraph(app, channel);
  }
}

export async function sendWeeklyGraph(app: ModifiedApp, channel: string) {
  const messagesTotal = app.db.get("messages_total").slice(0, 7);
  const graphUrl = `https://api.saahild.com/api/graph/line/simple?labels=Monday,Tuesday,Wensday,Thursday,Friday,Saturday,Sunday&y=${messagesTotal.join(",")}`;
  // attach as file or something
  await fetch(graphUrl)
    .then((r) => r.arrayBuffer())
    .then(Buffer.from)
    .then((d) => {
      writeFileSync(path.join(__dirname, "..", "graph.png"), d);
    });
  const img = path.join(__dirname, "..", "graph.png");
  await app.client.files.uploadV2({
    file: img,
    filename: `graph.png`,
    // thread_ts: mobj.ts,
    channel_id: channel,
    alt_text: `Your weekly message graph.`,
    initial_comment: `Your weekly message graph! Average message count per day is *${(messagesTotal.reduce((a, b) => a + b, 0) / messagesTotal.length).toFixed(2)}*`,
  });

  app.db.set("messages_total", []);
}
