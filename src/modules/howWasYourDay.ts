// how was your day reader?
// anyways

import JSONdb from "simple-json-db";
import { ModifiedApp } from "./slackapp";
import { getTodaysEvents } from "./hw";
import { GitBody, GitSession } from "./projectWaterydo";
import ms from "ms";
import { hacktime } from ".";
export let cached_spotify_songs = [];
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
  return `Well well <@${process.env.MY_USER_ID}> <${lastMessageLink}|how was your day>. either way heres some stuff about today.\n> Your hw:\n${hw} \nTodo.\n> your todo list you want to share here\n> also todo `;
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
export default async function (app: ModifiedApp, channel = `C07R8DYAZMM`) {
  const db = app.db;
  const getStr = await getDayResponse(db);
  const mobj = await app.client.chat.postMessage({
    channel,
    text: getStr,
  });
  const formattedHacktimeResults = await hacktime.getStatusBar().then((d) => {
    return d.map((e) => `- *${e.name}*: \`${e.text}\``).join("\n");
  });
  app.client.chat.postMessage({
    channel,
    thread_ts: mobj.ts,
    text: `Here are your :wakatime-dark: hacktime stats for today:\n${formattedHacktimeResults}`,
  });
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
  if (cached_spotify_songs.length > 0) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `Here is what you listned to today :spotify_new: : \n- ${[...new Set(cached_spotify_songs)].join("\n- ")}\n\n`.replaceAll(":spotify_new:", ":new_spotify:"),
    });
    cached_spotify_songs = [];
  }
  if (codewatcherForToday.length > 0) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `Well well well it also looks like you were using codewatcher today\n${codewatcherForToday.some((d) => d.repo.includes("zeon")) ? "> and i see u worked on some of my code :D you better have not fucked me up\n" : ""}Anyways here are the projects you recorded:\n> ${codewatcherForToday.map((d) => `Project: ${d.repo} which was recorded in <#${d.channel}> and lasted for an for ${ms(Math.round((d.ended_at || Date.now()) - d.started_at))}  - [<https://github.com/NeonGamerBot-QK/${d.repo}|repo>], [<${d.mlink}|message link>]  `).join("\n> ")}`,
    });
  }
}
