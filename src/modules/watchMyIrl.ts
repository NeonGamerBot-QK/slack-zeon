import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
import { find as findTz } from "geo-tz";
export default function watchLocation() {
  const location = null;
  // todo
}
export interface ShortcutUpdate {
  battery: number;
  clipboard: string;
  focus: string;
  "weather ": string;
  location: {
    lat: number;
    long: number;
    city: string;
    addr: string;
    name: string;
  };
}
export interface IrlData {
  latest_entry: ShortcutUpdate;
}
const mainTimezone = ["America/Kentucky/Louisville", `America/New_York`];
// ontimezoneswitch;
export async function watchTimezone(app: ModifiedApp, data: IrlData) {
  const tz = findTz(
    data.latest_entry.location.lat,
    data.latest_entry.location.long,
  )[0];
  if (!mainTimezone.includes(tz) && !app.db.get(`tz`)) {
    const m = await app.client.chat.postMessage({
      text: `Hello yall! Neon's tz has changed to *${tz}*\n_replies from neon may now differ..._`,
      channel: `C07R8DYAZMM`,
    });
    app.db.set(`tz`, {
      tz: tz,
      m: m.ts,
    });
  } else {
    if (app.db.get(`tz`) && !mainTimezone.includes(app.db.get('tz')) && mainTimezone.includes(tz)) {
      await app.client.chat.postMessage({
        thread_ts: app.db.get(`tz`).m,
        text: `Neon is back to his normal tz`,
        channel: `C07R8DYAZMM`,
        reply_broadcast: true,
      });
      app.db.delete(`tz`);
    }
  }
}
export async function watchBattery(app: ModifiedApp, data: IrlData) {
  const newBattery = data.latest_entry.battery;
  const lastEntry = app.db.get(`phone_battery`);
  if (newBattery != lastEntry && Math.abs(newBattery - lastEntry) > 50) {
    app.client.chat.postMessage({
      channel: `C07R8DYAZMM`,
      text: `Battery: *${newBattery}%* (changed more then 50%)`,
    });
  }
  if (
    newBattery < 20 &&
    (app.db.get(`phone_bat_noti`) || 0) - Date.now() > 1000 * 60 * 10
  ) {
    app.client.chat.postMessage({
      channel: `C07R8DYAZMM`,
      text: `Hey your at %${newBattery}% battery, please charge your phone you idiot.`,
    });
    app.db.set(`phone_bat_noti`, Date.now());
  }
  app.db.set(`phone_battery`, newBattery);
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
