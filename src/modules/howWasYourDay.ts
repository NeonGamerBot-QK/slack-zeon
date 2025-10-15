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
import { scrubPIIAuto } from "./randomResponseSystem";
import Keyv from "keyv";
export let cached_spotify_songs = [];
export async function resetSpotifyCache(app: ModifiedApp) {
  cached_spotify_songs = (await app.db.get("spotify_songs")) || [];
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

export async function getDayResponse(db: Keyv) {
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
    (await db.get("howday_last_message_link")) ||
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
      await app.db.set("howday_last_message_link", link);
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

export async function getRecentGames() {
  const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${process.env.STEAM_ID}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.games || [];
}
export async function getSteamString(db) {
  const state = (await db.get("steam_state")) || {};
  return await getRecentGames().then((games) => {
    let string = "";
    // console.log(JSON.stringify(games))
    // const state = { "105600": { "appid": 105600, "name": "Terraria", "playtime_2weeks": 9, "playtime_forever": 6634, "img_icon_url": "858961e95fbf869f136e1770d586e0caefd4cfac", "playtime_windows_forever": 4816, "playtime_mac_forever": 106, "playtime_linux_forever": 1711, "playtime_deck_forever": 9 }, "420530": { "appid": 420530, "name": "OneShot", "playtime_2weeks": 1, "playtime_forever": 60, "img_icon_url": "b5f932179c1e35da8651b4cc05b2cd96d0e6540b", "playtime_windows_forever": 36, "playtime_mac_forever": 24, "playtime_linux_forever": 1, "playtime_deck_forever": 1 }, "2073850": { "appid": 2073850, "name": "THE FINALS", "playtime_2weeks": 35, "playtime_forever": 61, "img_icon_url": "9532db560dca3b4982f4af3f5981b6b2ce2a6909", "playtime_windows_forever": 1, "playtime_mac_forever": 0, "playtime_linux_forever": 60, "playtime_deck_forever": 35 }, "2524890": { "appid": 2524890, "name": "Pixel Gun 3D: PC Edition", "playtime_2weeks": 30, "playtime_forever": 3411, "img_icon_url": "74fa3fd8d35a1b1cce00dc7831078c5cfedb1a6c", "playtime_windows_forever": 3311, "playtime_mac_forever": 0, "playtime_linux_forever": 100, "playtime_deck_forever": 30 }, "3410660": { "appid": 3410660, "name": "Glowkeeper", "playtime_2weeks": 1, "playtime_forever": 28, "img_icon_url": "a4098c76fdf7798a98eb0ef857e9598c43434cc6", "playtime_windows_forever": 0, "playtime_mac_forever": 0, "playtime_linux_forever": 28, "playtime_deck_forever": 1 } }
    const new_state = {};
    games.forEach((g) => {
      const prev = state[g.appid];
      if (!prev) {
        state[g.appid] = g;
      }
      new_state[g.appid] = g;
      string += `For ${g.name}:\n`;
      Object.keys(g).forEach((key) => {
        if (key.startsWith("playtime_") && key.endsWith("_forever")) {
          const minutes = g[key];
          const mss = ms((minutes - state[g.appid][key]) * 60 * 1000);
          string += ` - ${key.replace("playtime_", "").replace("_forever", "")}: ${minutes} minutes,  total =  ${mss}\n`;
        }
      });
    });
    db.set("steam_state", new_state);
    // console.log(string)
    return string;
  });
}

/**
 * @see https://github.com/SkyfallWasTaken/slack-activity-webhook/blob/main/index.ts
 */
export async function getMessageCount(db: Keyv) {
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
  switch (card.toLowerCase()) {
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
  return `${walletData.map((d) => `-${d.type == "rocket" ? getMoneyEmoji(d.card.toLowerCase()) : ":appleinc:"} - *${d.amount}* @ _${scrubPIIAuto(d.name)}_`).join("\n")}`;
}
export default async function (app: ModifiedApp, channel = `C07R8DYAZMM`) {
  const db = app.db;
  const getStr = await getDayResponse(db);
  const mobj = await app.client.chat.postMessage({
    channel,
    text: getStr,
  });
  const statusBar = await hacktime.getStatusBar();
  const formattedHacktimeResults = statusBar.projects
    .map((e) => `- *${e.name}*: \`${e.text}\``)
    .join("\n");
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
    ((await app.db.get("git_session")) || []) as GitSession[]
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
  try {
    const missing_receipts = await fetch(
      process.env.ZEON_DISCORD_INSTANCE + "/irl/slack/end_of_day_stats",
      {
        headers: {
          Authorization: process.env.IRL_AUTH,
        },
      },
    ).then(r => r.json()).then(d => d.missing_receipts.count)
    if (missing_receipts > 0) {
      const adjectives = [
        "tiny",       // 1–2
        "mild",       // 3–4
        "concerning", // 5–6
        "damn",       // 7–9
        "brutal",     // 10–14
        "insane",     // 15–19
        "utterly ridiculous", // 20+
      ];

      let adj;
      if (missing_receipts < 3) adj = adjectives[0];
      else if (missing_receipts < 5) adj = adjectives[1];
      else if (missing_receipts < 7) adj = adjectives[2];
      else if (missing_receipts < 10) adj = adjectives[3];
      else if (missing_receipts < 15) adj = adjectives[4];
      else if (missing_receipts < 20) adj = adjectives[5];
      else adj = adjectives[6];

      await app.client.chat.postMessage({
        channel,
        thread_ts: mobj.ts,
        text: `You have a *${adj}* ${missing_receipts} missing receipts (aka not marked as lost / no receipt URL found)! Please upload them when you can!`,
      });
    } else {
      app.client.chat.postMessage({
        channel,
        thread_ts: mobj.ts,
        text: `No missing receipts for today :yay:`,
      });
    }
  } catch (e) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `Oopsies i cant get ur missing receipts amount.`,
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
    await app.db.delete("spotify_songs");
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
  // TODO HERE: location graph thingy
  await app.client.chat.postMessage({
    channel,
    thread_ts: mobj.ts,
    text: await getMessageCount(app.db),
  });
  const github_stuff = ((await app.db.get("git_commits_today")) || []).map(
    (body) =>
      `${body.is_zeon ? ":zeon: " : ""}\`<https://github.com/NeonGamerBot-QK/${body.repo_name}/commits/${body.commit_id}|${body.commit_id.slice(0, 7)}>\``,
  );
  if (github_stuff.length > 0) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `Here are your github commits:\n${github_stuff.join("\n")}`,
    });
  } else {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `No github commits found... like this is concerning /gen`,
    });
  }

  if (await app.db.get("afk_sessions")) {
    const sessions = ((await app.db.get("afk_sessions")) || []).filter(
      (d) => d.created_at > Date.now() - 1000 * 60 * 60 * 24,
    );
    if (sessions.length > 0) {
      await app.client.chat.postMessage({
        channel,
        thread_ts: mobj.ts,
        text: `Also you had *${sessions.length}* AFK sessions today, totalling to *${ms(sessions.map((d) => d.ended_at - d.created_at).reduce((a, b) => a + b, 0))}* of AFK time :eyes:\n${sessions.map((d) => `- afk for *${ms(d.ended_at - d.created_at)}* because ${d.reason}`).join("\n")}`,
      });
    }
  }

  const steamstring = await getSteamString(app.db);
  if (steamstring.length > 5) {
    await app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `You also played some games on steam today :steam:\n${steamstring}`,
    });
  } else {
    await app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `No steam activity for today found...`,
    });
  }
  try {
    const trustChanges = await fetchHackatimeTrustLogs().then(
      summarizeTrustChanges,
    );
    if (trustChanges.length > 5) {
      await app.client.chat.postMessage({
        channel,
        thread_ts: mobj.ts,
        text: `Your hackatime changes today: \n> ${trustChanges}`,
      });
    } else {
      await app.client.chat.postMessage({
        channel,
        thread_ts: mobj.ts,
        text: `No hackatime bans today...`,
      });
    }
  } catch (e) {
    app.client.chat.postMessage({
      channel,
      thread_ts: mobj.ts,
      text: `No hackatime bans today(err: ${e.message})...`,
    });
  }

  await app.db.delete("git_commits_today");
  if (
    (await app.db.get("messages_total")) &&
    (await app.db.get("messages_total")).length >= 7
  ) {
    // send weekly graph to channel
    sendWeeklyGraph(app, channel);
  }
}

export async function sendWeeklyGraph(app: ModifiedApp, channel: string) {
  const messagesTotal = (await app.db.get("messages_total")).slice(0, 7);
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
function fetchHackatimeTrustLogs() {
  return fetch("https://hackatime.hackclub.com/api/admin/v1/execute", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.HACKATIME_API_KEY,
      "Content-Type": "application/json",
    },
    // body: '{"query": "SELECT tla.*, u1.slack_uid  AS user_slack_uid, u2.slack_uid  AS changed_by_slack_uid FROM trust_level_audit_logs AS tla JOIN users AS u1 ON u1.id = tla.user_id JOIN users AS u2 ON u2.id = tla.changed_by_id LIMIT 1;"}',
    body: JSON.stringify({
      query:
        "SELECT id, previous_trust_level, new_trust_level, created_at FROM trust_level_audit_logs WHERE changed_by_id = 41 AND created_at >= NOW() - INTERVAL '24 hours' ORDER BY id DESC",
    }),
  })
    .then((d) => d.json())
    .then(async (data) => {
      return data.rows;
    });
}

export function summarizeTrustChanges(data) {
  let banned = 0;
  let unbanned = 0;

  for (const entry of data) {
    const prev = entry.previous_trust_level[1];
    const next = entry.new_trust_level[1];

    // Count banned
    if (next === "red" || (next === "yellow" && prev === "blue")) {
      banned++;
    }

    // Count unbanned
    if (prev === "red") {
      unbanned++;
    }
  }

  return `Banned: ${banned}, Unbanned: ${unbanned}, total changes: ${data.length}`;
}
