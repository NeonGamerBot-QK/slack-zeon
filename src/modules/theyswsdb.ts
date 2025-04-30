import { ModifiedApp } from "./slackapp";
import { Cron } from "croner";

// zach i really dont like ts but at the end of the day ill prob end up using it smh
const url = "https://api.ships.hackclub.com/";
/**
 * eg
 * {
    "approved_at": [
      2025,
      91
    ],
    "code_url": "https://github.com/hackclub/browserbuddy/pull/173",
    "country": null,
    "demo_url": null,
    "description": "it is a chrome browser extension that gives you access to hack club AI, it has current page context\n",
    "github_username": "aadilnoufal",
    "heard_through": "Arcade ofc, the best github mail I ever received that truly changed my life",
    "hours": null,
    "id": "recCm01Is0BWUk4ud",
    "ysws": "BrowserBuddy"
  },
 */
export interface YswsShipEntry {
  approved_at?: number[];
  code_url?: string;
  country?: string;
  demo_url?: string;
  description?: string;
  github_username?: string;
  heard_through?: string;
  hours?: number;
  id: string;
  ysws: string;
}
type responseData = YswsShipEntry[];
function dayOfYearToDate([year, dayOfYear]: number[]) {
  const date = new Date(year, 0);
  date.setDate(dayOfYear);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function execStuff(app: ModifiedApp, channel: string) {
  // so we start praying
  const data = (await fetch(url).then((r) => r.json())) as responseData;
  for (const d of data) {
    if (await app.kdbs.yswsdb.has(d.id)) continue;
    try {
      const date = d.approved_at ? dayOfYearToDate(d.approved_at) : "Unk Date";
      app.client.chat.postMessage({
        channel,
        text: `:ship::shipitparrot: A new ship was approved in the ysws: *${d.ysws}* and the author of this ship was *${d.github_username}* here is some info about the ship:\n> ${d.approved_at ? `Approved on ${date}` : "No approval date"}\n> Description: ${d.description ?? "No description"}\n> ${d.demo_url ? `<${d.demo_url}|Demo>` : "No demo"}\n> ${d.code_url ? `<${d.code_url}|Code>` : "No code"}\n> Heard thru: ${d.heard_through ?? "N/A"}\n> Country: ${d.country ?? "No country"}\n> Hours: ${d.hours ?? "No hours found"}`,
      });
      await app.kdbs.yswsdb.set(d.id, true);
      await new Promise((r) => setTimeout(r, 1.5 * 1000));
    } catch (e) {
      // // send with no img~
      console.error(e);
    } finally {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const alloftheentries =
    (await app.kdbs.yswsdb.get("all_of_the_entries")) || [];
  alloftheentries.push(data);
  await app.kdbs.yswsdb.set("all_of_the_entries", alloftheentries);
  await app.kdbs.yswsdb.set("last_entry", data);
  return 1;
}
export function cronJobForYSWS(app: ModifiedApp) {
  new Cron("0 */6 * * *", async () => {
    await execStuff(app, `C08QXJ8ASGY`);
  });
}
