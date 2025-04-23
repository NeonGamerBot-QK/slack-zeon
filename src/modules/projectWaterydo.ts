import { App } from "@slack/bolt";
import ms from "ms";
import JSONdb from "simple-json-db";
export interface GitBody {
  commit_id: string;
  commit_url: string;
  repo_name: string;
  is_zeon: boolean;
}
export interface GitSession {
  active: boolean;
  repo: string;
  channel: string;
  started_at: number;
  ended_at: null | number;
  message_ts: null | string;
  mlink: null | string;
}
function getTimeOfDay() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 9) {
    return "Early Morning";
  } else if (hour >= 9 && hour < 12) {
    return "Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Evening";
  } else {
    return "Night";
  }
}

export function handleGitRequest(body: GitBody, app: App) {
  const funny_words = [
    "Mom! look i did something!",
    "This is a working moment",
    "I love linting your code :3",
    `On this fine ${getTimeOfDay()}, im still working on code bruv`,
    "PLEASE THIS NEEDS TO WORK",
    "neon ur code sucks so im linting it",
    `neon ur code is ASSSS`,
    "this is what happens when you dont use spaces idiot",
    "yum yum code :3",
    `After being up for ${ms(process.uptime() * 1000)} im still at it!!`,
  ];
  if (!db) return;
  if (!body.is_zeon) {
    const oldEntries = db.get("git_commits_today") || [];
    oldEntries.push(body);
    db.set("git_commits_today", oldEntries);
  }
  if (body.is_zeon) {
    app.client.chat.postMessage({
      channel: `C07LEEB50KD`,
      text: `${funny_words[Math.floor(Math.random() * funny_words.length)]}\n> :zeon:\`<https://github.com/NeonGamerBot-QK/${body.repo_name}/commits/${body.commit_id}|${body.commit_id.slice(0, 7)}>\``,
    });
  }
  if (!db.get("git_session")) return;
  const session = (db.get("git_session") || []).find(
    (e) => e.active,
  ) as GitSession;
  if (!session) return;
  if (session.repo !== body.repo_name) return;
  app.client.chat.postMessage({
    channel: session.channel,
    thread_ts: session.message_ts!,
    text: `${body.is_zeon ? ":zeon: " : ""}\`<https://github.com/NeonGamerBot-QK/${body.repo_name}/commits/${body.commit_id}|${body.commit_id.slice(0, 7)}>\``,
  });
}

export let db: null | JSONdb = null;
export function attachDB(d: JSONdb) {
  db = d;
}
