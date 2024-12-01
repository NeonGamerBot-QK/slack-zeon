import { ModifiedApp } from "./slackapp";
import cheerio from "cheerio";
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
  const libD = await fetch(
    `https://adventofcode.com/2024/day/${new Date().getDate()}`,
  );
  if (libD.status == 404) {
    //retry
    return;
  }
  const txt = await libD.text();
  const $ = cheerio.load(txt);
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
