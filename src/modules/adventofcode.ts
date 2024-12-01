import { ModifiedApp } from "./slackapp";

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
  for (const mem of members.sort((a, b) => a.stars - b.stars)) {
    t.push(`${i}. *${mem.name}* has *${mem.stars}* :star:  stars`);
    i++;
  }
  await app.client.chat.postMessage({
    text: t.join("\n"),
    channel,
  });
}
