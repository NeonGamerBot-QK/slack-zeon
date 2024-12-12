import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
// import cheerio from "cheerio";
export async function getAdventOfCodeLb() {
  const lbD = await fetch(
    "https://adventofcode.com/2024/leaderboard/private/view/3282503.json",
    {
      headers: {
        Cookie: "session=" + process.env.ADV_COOKIE,
      },
    },
  ).then((r) => r.json());
  return lbD;
}
export function setupCronAdventOfCode(app: ModifiedApp) {
  // only for the month of december every day at 11pm
  cron.schedule("0 23 * 12 *", async () => {
    //@ts-ignore
    app.utils.adventOfCode.default(app, `C01GF9987SL`);
  });
  cron.schedule("0 0 * 12 *", () => {
    app.utils.adventOfCode.newDayNewChallange(app, `C01GF9987SL`);
  });
  cron.schedule(`0 * * * *`, async () => {
    const lb = await getAdventOfCodeLb();
    app.db.set(`adventofcode_lb`, lb);
  });
}
export default async function adventOfCode(app: ModifiedApp, channel: string) {
  const lbD = await fetch(
    "https://adventofcode.com/2024/leaderboard/private/view/3282503.json",
    {
      headers: {
        Cookie: "session=" + process.env.ADV_COOKIE,
      },
    },
  ).then((r) => r.json());
  const members: any[] = Object.values(lbD.members);
  let t = [];
  let i = 1;
  for (const mem of members.sort((a, b) => b.local_score - a.local_score)) {
    t.push(`${i}. *${mem.name}* has *${mem.stars}* :star:  stars`);
    i++;
  }
  await app.client.chat.postMessage({
    text: t.join("\n"),
    channel,
  });
}

export async function newDayNewChallange(app: ModifiedApp, channel: string) {
  // if it works dont ask
  const cheerio = await import("cheerio");

  const libD = await fetch(
    `https://adventofcode.com/2024/day/${new Date().getDate()}`,
  );
  console.log(libD);
  if (libD.status == 404) {
    //retry
    return;
  }
  const txt = await libD.text();
  if (!txt) return;
  console.log(cheerio, txt);
  const $ = cheerio.load(txt.toString() || "<html></html>");
  const data = $(".day-desc").text();
  const om = await app.client.chat.postMessage({
    text: `Todays Challange!\n in the thread is the prompt and the answers!`,
    channel,
  });
  await app.client.chat.postMessage({
    text: data,
    channel: om.channel,
    thread_ts: om.ts,
  });

  // selector document.getElementsByClassName('day-desc')[0].innerText
}
