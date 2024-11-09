import { App } from "@slack/bolt";
import JSONdb from "simple-json-db";
export interface GitBody {
  commit_id: string;
  commit_url: string;
  repo_name: string;
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
export function handleGitRequest(body: GitBody, app: App) {
  if (!db) return;
  if (!db.get("git_session")) return;
  const session = (db.get("git_session") || []).find(
    (e) => e.active,
  ) as GitSession;
  if (!session) return;
  if (session.repo !== body.repo_name) return;
  app.client.chat.postMessage({
    channel: session.channel,
    thread_ts: session.message_ts!,
    text: body.commit_url,
  });
}

export let db: null | JSONdb = null;
export function attachDB(d: JSONdb) {
  db = d;
}
// export function handleStartup() {

// }
