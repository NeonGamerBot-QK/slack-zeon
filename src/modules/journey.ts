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
  id: number;
}
export interface Comment {
  text: string;
  update_id: number;
  slack_id: string;
  created_at: string;
}
const baseURL = `https://summer.hackclub.com/`;
let lastPageIndicators = {
  projects: 1,
  devlogs: 1,
  comments: 1,
};
export async function getLastPage(endpoint: string) {
  return lastPageIndicators[endpoint] || 1;
  const v = await fetch(`${baseURL}api/v1/${endpoint}`)
    .then((r) => r.json())
    .then((d) => d.pagination.pages);
  console.log(`Pages(${endpoint}): ${v}`);
  return typeof v == "number" ? v : 1;
}
export async function getShips(): Promise<Ship[]> {
  return fetch(
    `${baseURL}api/v1/projects?page=${await getLastPage("projects")}`,
    {
      headers: {
        Cookie: process.env.SOM_COOKIE,
        // rowan i hate u
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    },
  )
    .then((r) => r.json())
    .then((d) => {
      lastPageIndicators.projects = d.pagination.pages;
      return d.projects;
    });
}
export async function getUpdates(): Promise<Update[]> {
  return fetch(
    `${baseURL}api/v1/devlogs?page=${await getLastPage("devlogs")}`,
    {
      headers: {
        Cookie: process.env.SOM_COOKIE,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    },
  )
    .then((r) => r.json())
    .then((d) => {
      lastPageIndicators.devlogs = d.pagination.pages;
      return d.devlogs;
    });
}
export async function getComments(): Promise<Comment[]> {
  return fetch(
    `${baseURL}api/v1/comments?page=${await getLastPage("comments")}`,
    {
      headers: {
        Cookie: process.env.SOM_COOKIE,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    },
  )
    .then((r) => r.json())
    .then((d) => {
      lastPageIndicators.comments = d.pagination.pages;
      return d.comments;
    });
}
export async function shipsCron(app: ModifiedApp) {
  const ships = await getShips();
  if (!ships || ships.length === 0) {
    console.log("No ships found");
    return;
  }
  for (const ship of ships) {
    const shipId = ship.id.toString();
    if (app.dbs.journey.get(shipId)) continue;
    ship.title = ship.title
      .replace("<!channel>", "")
      .replace("@channel", "")
      .replace("@here", "")
      .replace("<!here>", "");
    ship.description = ship.description
      .replace("<!channel>", "")
      .replace("@channel", "")
      .replace("@here", "")
      .replace("<!here>", "");

    try {
      // construct message :3
      const msg = await app.client.chat.postMessage({
        channel: `C091CEEHJ9K`,
        text: `New Project! ${ship.title}`,
        username: "Explorpheus",
        icon_url:
          "https://hc-cdn.hel1.your-objectstorage.com/s/v3/d6d828d6ba656d09a62add59dc07e2974bfdb38f_image.png",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
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
                url: `https://summer.hackclub.com/projects/${ship.id}`,
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
    } catch (e) {
      console.error("Error sending ship message", e);
    }
    // app.dbs.journey.set(u)
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function shipUpdatesCron(app: ModifiedApp) {
  const updates = await getUpdates();
  for (const update of updates) {
    const entry = app.dbs.journey.get(update.project_id.toString());
    if (!entry) continue;
    if (entry.updates.find((e) => e.meta.created_at === update.created_at))
      continue;
    let msg = null;
    update.text = update.text
      .replace("<!channel>", "")
      .replace("@channel", "")
      .replace("@here", "")
      .replace("<!here>", "");
    try {
      msg = await app.client.chat.postMessage({
        channel: `C091CEEHJ9K`,
        thread_ts: entry.root_message,
        username: "Explorpheus",
        icon_url:
          "https://hc-cdn.hel1.your-objectstorage.com/s/v3/d6d828d6ba656d09a62add59dc07e2974bfdb38f_image.png",
        reply_broadcast: true,
        text: update.text.slice(0, 3000) || "no update text huh",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              // TODO add the ping back
              text: `:tada: *New Update!* by <@${update.slack_id}> \n${update.text.slice(0, 2900)}`,
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
    } catch (e) {
      // please dont use bad img urls smh
      msg = await app.client.chat.postMessage({
        channel: `C091CEEHJ9K`,
        thread_ts: entry.root_message,
        username: "Explorpheus",
        icon_url:
          "https://hc-cdn.hel1.your-objectstorage.com/s/v3/d6d828d6ba656d09a62add59dc07e2974bfdb38f_image.png",
        reply_broadcast: true,
        text: update.text.slice(0, 3000) || "no update text huh",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              // TODO add the ping back
              text: `:tada: *New Update!* by <@${update.slack_id}> \n${update.text.slice(0, 2900)}`,
            },
          },
        ].filter(Boolean),
      });
    }
    entry.updates.push({
      meta: update,
      created_at: Date.now(),
      ts: msg.ts,
      comments: [],
    });
    app.dbs.journey.set(`update_${update.id}`, entry);
    app.dbs.journey.set(entry.id, entry);

    await new Promise((r) => setTimeout(r, 500));
  }
}
export async function commentsCron(app: ModifiedApp) {
  console.log(1);
  const comments = await getComments();
  console.log(0);
  for (const comment of comments) {
    const entryId = app.dbs.journey.get(`update_${comment.update_id}`);
    console.log(entryId, comment, "debugging hell");
    if (!entryId) continue;
    const entry = app.dbs.journey.get(entryId.root_ship_meta.id);
    if (!entry) continue;
    if (!entry.updates.find((e) => e.meta.id === comment.update_id)) continue;
    if (
      entry.updates
        .find((e) => e.meta.id === comment.update_id)
        .comments.some((d) => d.meta.created_at == comment.created_at)
    )
      continue;
    console.log("Sending journey comment aaaa", entry);
    const msg = await app.client.chat.postMessage({
      channel: `C091CEEHJ9K`,
      thread_ts: entry.root_message,
      text: comment.text ? comment.text.slice(0, 3000) : "no comment text huh",
      username: "Explorpheus",
      icon_url:
        "https://hc-cdn.hel1.your-objectstorage.com/s/v3/d6d828d6ba656d09a62add59dc07e2974bfdb38f_image.png",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:tada: *New Comment!* by <@${comment.slack_id}> \n${comment.text ? comment.text.slice(0, 2900) : "No comment text found"}`,
          },
        },
      ],
    });
    entry.updates
      .find((e) => e.meta.id === comment.update_id)
      .comments.push({
        meta: comment,
        created_at: Date.now(),
        ts: msg.ts,
      });
    app.dbs.journey.set(entry.id, entry);
    await new Promise((r) => setTimeout(r, 500));
  }
}

export async function iRunOnCron(app: ModifiedApp) {
  app.client.chat.postMessage({
    text: `${baseURL}api/v1/projects?page=${await getLastPage("projects")}`,
    channel: `D07LBMXD9FF`,
  });
  await shipsCron(app);
  try {
    await commentsCron(app);
  } catch (e) {}
  await new Promise((r) => setTimeout(r, 1000));
  await shipUpdatesCron(app);
  await new Promise((r) => setTimeout(r, 750));
}
export function ActualCronForJourney(app: ModifiedApp) {
  new Cron("*/5 * * * *", async () => {
    await iRunOnCron(app);
  });
}
