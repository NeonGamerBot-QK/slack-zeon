import { Cron } from "croner";
import { ModifiedApp } from "./slackapp";
export interface Ship {
  id: number;
  title: string;
  description: string;
  category: string;
  readme_link: string;
  demo_link: string;
  repo_link: string;
  banner: string;
  slack_id: string;
  created_at: string;
  updated_at: string;
}
export interface Update {
  text: string;
  attachment?: string;
  project_id: number;
  slack_id: string;
  created_at: string;
  updated_at: string;
}
export interface Comment {
  text: string;
  update_id: number;
  slack_id: string;
  created_at: string;
}
export function getShips(): Promise<Ship[]> {
  return fetch("https://journey.hackclub.com/api/v1/projects").then((r) =>
    r.json(),
  );
}
export function getUpdates(): Promise<Update[]> {
  return fetch("https://journey.hackclub.com/api/v1/updates").then((r) =>
    r.json(),
  );
}
export function getComments(): Promise<Comment[]> {
  return fetch("https://journey.hackclub.com/api/v1/comments").then((r) =>
    r.json(),
  );
}
export async function shipsCron(app: ModifiedApp) {
  const ships = await getShips();
  for (const ship of ships) {
    const shipId = ship.id.toString();
    if (app.dbs.journey.get(shipId)) continue;
    // construct message :3
    const msg = await app.client.chat.postMessage({
      channel: `C08N1NWKEF4`,
      text: `New Project! ${ship.title}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            // TODO add the ping back
            text: `:tada: *New/ project!*\n*${ship.title}*\n_${ship.description}_ by <@${ship.slack_id}>`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              action_id: "button-action-" + Math.random(),
              text: {
                type: "plain_text",
                text: "View Project",
                emoji: true,
              },
              url: `https://journey.hackclub.com/projects/${ship.id}`,
            },
          ],
        },
        (ship.readme_link || ship.demo_link || ship.repo_link) && {
          type: "actions",
          elements: [
            ship.readme_link && {
              type: "button",
              action_id: "button-action-" + Math.random(),
              text: {
                type: "plain_text",
                text: "Readme",
                emoji: true,
              },
              url: ship.readme_link,
            },
            ship.demo_link && {
              type: "button",
              action_id: "button-action-" + Math.random(),
              text: {
                type: "plain_text",
                text: "Demo",
                emoji: true,
              },
              url: ship.demo_link,
            },
            ship.repo_link && {
              type: "button",
              action_id: "button-action-" + Math.random(),
              text: {
                type: "plain_text",
                text: ":github: Repo",
                emoji: true,
              },
              url: ship.repo_link,
            },
          ].filter(Boolean),
        },
        {
          type: "divider",
        },
      ].filter(Boolean),
    });
    app.dbs.journey.set(shipId, {
      root_message: msg.ts,
      updates: [],
      created_at: Date.now(),
      root_ship_meta: ship,
    });
    // app.dbs.journey.set(u)
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function shipUpdatesCron(app: ModifiedApp) {
  const updates = await getUpdates();
  for (const update of updates) {
    const entry = app.dbs.journey.get(update.project_id.toString());
    if (!entry) continue;
let msg = null;
try {
     msg = await app.client.chat.postMessage({
        channel: `C08N1NWKEF4`,
        thread_ts: entry.root_message,
        reply_broadcast: true,
        text: update.text || "no update text huh",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              // TODO add the ping back
              text: `:tada: *New Update!*\n_${update.text}_ by <@${update.slack_id}>`,
            },
          },
          // add image
          update.attachment && {
            type: "image",
            image_url: update.attachment,
            alt_text: "image",
          },
        ].filter(Boolean),
      });
} catch(e) {
    // please dont use bad img urls smh
    msg = await app.client.chat.postMessage({
        channel: `C08N1NWKEF4`,
        thread_ts: entry.root_message,
        reply_broadcast: true,
        text: update.text || "no update text huh",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              // TODO add the ping back
              text: `:tada: *New Update!*\n_${update.text}_ by <@${update.slack_id}>`,
            },
          }
        ].filter(Boolean),
      });
}
    entry.updates.push({
      meta: update,
      created_at: Date.now(),
      ts: msg.ts,
      comments: [],
    });
    // app.dbs.journey.set(update.)
    app.dbs.journey.set(entry.id, entry);
    await new Promise((r) => setTimeout(r, 500));
  }
}

export async function iRunOnCron(app: ModifiedApp) {
  await shipsCron(app);
  await new Promise((r) => setTimeout(r, 1000));
  await shipUpdatesCron(app);
  await new Promise((r) => setTimeout(r, 750));
}
export function ActualCronForJourney(app: ModifiedApp) {
  new Cron("*/5 * * * *", async () => {
    await iRunOnCron(app);
  });
}
