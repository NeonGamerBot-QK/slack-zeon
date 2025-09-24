import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
import { find as findTz } from "geo-tz";
export default function watchLocation() {
  const location = null;
  // todo
}
export interface ShortcutUpdate {
  id: number;
  lat: number;
  long: number;
  addr: string;
  city: string;
  name: string;
  clipboard: string;
  focus: string;
  battery: number;
  weather: string;
  created_at: string;
  type?: any;
}
export interface IrlData {
  latest_entry: ShortcutUpdate;
}
const mainTimezone = ["America/Kentucky/Louisville", `America/New_York`];
// ontimezoneswitch;
export async function watchTimezone(app: ModifiedApp, data: IrlData) {
  const tz = findTz(data.latest_entry.lat, data.latest_entry.long)[0];
  if (!mainTimezone.includes(tz) && !(await app.db.get(`tz`))) {
    const m = await app.client.chat.postMessage({
      text: `Hello yall! Neon's tz has changed to *${tz}*\n_replies from neon may now differ..._`,
      channel: `C07R8DYAZMM`,
    });
    await app.db.set(`tz`, {
      tz: tz,
      m: m.ts,
    });
  } else {
    if (
      (await app.db.get(`tz`)) &&
      !mainTimezone.includes(await app.db.get("tz")) &&
      mainTimezone.includes(tz)
    ) {
      await app.client.chat.postMessage({
        thread_ts: (await app.db.get(`tz`)).m,
        text: `Neon is back to his normal tz`,
        channel: `C07R8DYAZMM`,
        reply_broadcast: true,
      });
      await app.db.delete(`tz`);
    }
  }
}
export async function watchBattery(app: ModifiedApp, data: IrlData) {
  const newBattery = data.latest_entry.battery;
  const lastEntry = await app.db.get(`phone_battery`);
  if (newBattery != lastEntry && Math.abs(newBattery - lastEntry) > 50) {
    app.client.chat.postMessage({
      channel: `C07R8DYAZMM`,
      text: `Battery: *${newBattery}%* (changed more then 50%)`,
    });
  }
  if (
    newBattery < 20 &&
    ((await app.db.get(`phone_bat_noti`)) || 0) - Date.now() > 1000 * 60 * 10
  ) {
    app.client.chat.postMessage({
      channel: `C07R8DYAZMM`,
      text: `Hey your at %${newBattery}% battery, please charge your phone you idiot.`,
    });
    await app.db.set(`phone_bat_noti`, Date.now());
  }
  await app.db.set(`phone_battery`, newBattery);
}

export function setupCronForIrl(app: ModifiedApp) {
  cron.schedule("*/5 * * * *", async () => {
    const data = (await fetch(
      process.env.ZEON_DISCORD_INSTANCE + "/irl/shortcut_updates",
      {
        headers: {
          Authorization: process.env.IRL_AUTH,
        },
      },
    ).then((r) => r.json())) as IrlData;
    watchBattery(app, data);
    watchTimezone(app, data);
  });
}

function generateMovementGraph(updates) {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Filter updates from the last 24 hours
  const last24h = updates
    .filter(u => u.created_at >= oneDayAgo)
    .sort((a, b) => a.created_at - b.created_at);

  if (last24h.length === 0) return 'No updates in the last 24 hours.';

  // Bucket lat/lon to anonymize locations
  function bucketLocation(lat, lon, precision = 5) {
    return `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
  }

  const timeline = last24h.map(u => bucketLocation(u.lat, u.long));

  // Remove consecutive duplicates
  const condensed = timeline.filter((loc, i, arr) => i === 0 || loc !== arr[i - 1]);

  // Assign anonymized names to each unique location
  const locationMap = {};
  let counter = 1;
  const namedTimeline = condensed.map(loc => {
    if (!locationMap[loc]) locationMap[loc] = `Location ${counter++}`;
    return locationMap[loc];
  });

  // Build the string graph
  return namedTimeline.join(' -> ');
}
