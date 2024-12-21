import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
export function highSeasCron(app: ModifiedApp) {
  cron.schedule(`* * * * *`, async () => {
    try {
      await fetch("https://highseas.hackclub.com/shipyard", {
        method: "POST",
        headers: {
          Cookie: process.env.HIGH_SEAS_COOKIES,
        },
        body: "[]",
      }).then((r) => {
        const oldAmount = app.db.get(`highseas_tickets`);
        const cookieHeader = r.headers
          .getSetCookie()
          .find((e) => e.startsWith("tickets="));
        const amount = parseFloat(
          cookieHeader.split(`tickets=`)[1].split(";")[0],
        ).toFixed(2);
        // console.log(`You have ${parseFloat(amount).toFixed(2)} amount of doubloons`)
        app.db.set(`highseas_tickets`, amount);
        if (oldAmount !== amount) {
          const diff = parseFloat(
            (parseFloat(amount) - parseFloat(oldAmount)).toFixed(2),
          );
          app.client.chat.postMessage({
            text: `*Doubloonies* :3\n:doubloon: ${oldAmount} -> ${amount} :doubloon: (diff ${diff > 0 ? `+${diff}` : diff} :doubloon: )`,
            channel: `C07R8DYAZMM`,
          });
        }
      });
    } catch (e) {
      await app.client.chat.postMessage({
        text: `*Doubloonies* :3\n:x: Error :x: maybe update ur token for high seas\n\n${e.stack}`,
        channel: `C07LGLUTNH2`,
      });
    }
  });
  cron.schedule("*/5 * * * *", async () => {
    // update da cache
    const oldInstance = app.db.get(`highseas_lb`) || [];
    const newInstance = await getLb();
    app.db.set(`highseas_lb`, newInstance);
    // run diff for all users who have opted in
    if (app.db.get(`highseas_lb_ts`)) {
      await app.client.chat.delete({
        channel: `C086HHP5J7K`,
        ts: app.db.get(`highseas_lb_ts`)!,
      });
    }
    await app.client.chat
      .postMessage({
        channel: `C086HHP5J7K`,
        text: `*High Seas Lb* (top 10)\n${newInstance
          .slice(0, 10)
          .map(
            (d) =>
              `\`<@${d.id}>\` - ${parseInt(d.current_doubloons)} :doubloon:`,
          )
          .join("\n")}`,
      })
      .then((e) => {
        app.db.set(`highseas_lb_ts`, e.ts);
      });
    for (const user of app.db.get(`i_want_to_track_my_doubloons`) || []) {
      const oldUserData = oldInstance.find((e) => e.id == user.id);
      const newUserData = newInstance.find((e) => e.id == user.id);
      if (!oldUserData && !newUserData) continue;
      if (oldUserData && newUserData) {
      }
    }
  });
}

export async function getLb() {
  const all_users = [];
  const page0 = await fetch(
    "https://doubloons.cyteon.hackclub.app/api/v1/data?page=1",
  ).then((r) => r.json());
  const pages = page0.pages;
  for (let i = 0; i < pages; i++) {
    const page = fetch(
      `https://doubloons.cyteon.hackclub.app/api/v1/data?page=${i + 1}`,
    )
      .then((r) => r.json())
      .then((r) => r.users);
    all_users.push(page);
  }
  return (await Promise.all(all_users)).flat();
}
