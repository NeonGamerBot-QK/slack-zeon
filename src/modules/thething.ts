import crypto from "crypto";
import { ModifiedApp } from "./slackapp";

export interface RootInterface {
  "Slack ID": string;
  "GitHub username": string;
  "Schedule match": boolean;
  "Can stream"?: boolean;
  "Planning on adding..."?: string;
  "Display name": string;
  "Avatar URL": string;
}

function sha256OfJson(obj: any): string {
  const json = JSON.stringify(obj, Object.keys(obj).sort()); // sort keys
  return crypto.createHash("sha256").update(json).digest("hex");
}

export async function cronThingy(app: ModifiedApp) {
  const object = await fetch("https://thing.hackclub.com/queue")
    .then((r) => r.json())
    .then((d) => d as RootInterface[]);
  for (const obj of object) {
    const objHash = sha256OfJson(obj);
    if (app.dbs.thething.get(objHash)) continue;

    app.client.chat.postMessage({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:wave:\n*<https://github.com/${obj["GitHub username"]}|${obj["Display name"]}>*`,
          },
          accessory: {
            type: "image",
            image_url: obj["Avatar URL"],
            alt_text: obj["Display name"],
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `:slack: *Slack ID:* \`${obj["Slack ID"]}\``,
            },
            {
              type: "mrkdwn",
              text: `:calendar: *Schedule match:* ${obj["Schedule match"]}`,
            },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `:video_camera: *Can stream:* ${obj["Can stream"]}`,
            },
            {
              type: "mrkdwn",
              text: `:bulb: *Planning to add:* _${obj["Planning on adding..."]}..._`,
            },
          ],
        },
      ],
      channel: `C08MFTG96BH`,
    });
    app.dbs.thething.set(objHash, true);
    await new Promise((r) => setTimeout(r, 250));
  }
}
export async function cronTS(app: ModifiedApp) {
  await cronThingy(app);
  await new Promise((r) => setTimeout(r, 60 * 1000));
  await cronTS(app);
}
