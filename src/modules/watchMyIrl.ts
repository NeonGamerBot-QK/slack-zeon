import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
export default function watchLocation() {
  const location = null;
  // todo
}

export async function watchBattery(app: ModifiedApp) {
  const data = await fetch(
    process.env.ZEON_DISCORD_INSTANCE + "/irl/shortcut_updates",
    {
      headers: {
        Authorization: process.env.IRL_AUTH,
      },
    },
  ).then((r) => r.json());
  const newBattery = data.latest_entry.battery;
  const lastEntry = app.db.get(`phone_battery`);
  if (newBattery != lastEntry && Math.abs(newBattery - lastEntry) > 50) {
    app.client.chat.postMessage({
      channel: `C07UNAHD9C3`,
      text: `Battery: *${newBattery}%* (changed more then 50%)`,
    });
  }
  if (
    newBattery < 20 &&
    (app.db.get(`phone_bat_noti`) || 0) - Date.now() > 1000 * 60 * 10
  ) {
    app.client.chat.postMessage({
      channel: `C07UNAHD9C3`,
      text: `Hey your at %${newBattery}% battery, please charge your phone you idiot.`,
    });
    app.db.set(`phone_bat_noti`, Date.now());
  }
  app.db.set(`phone_battery`, newBattery);
}

export function setupCronForIrl(app: ModifiedApp) {
  cron.schedule("*/5 * * * *", async () => {
    watchBattery(app);
  });
}
