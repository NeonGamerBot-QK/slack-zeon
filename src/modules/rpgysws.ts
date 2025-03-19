import { Cron } from "croner";
import { ModifiedApp } from "./slackapp";

export function parseScriptMoment(t: string) {
  let tt = t.split(":").slice(1).join(":");
  // console.log(tt)
  const json = JSON.parse(tt.slice(0, tt.length - 4));
  // const res = []
  // lil chat moment
  if (!Array.isArray(json) || json.length < 4 || typeof json[3] !== "object")
    return null;

  const leaderboard = [];

  const children = json[3].children[2][3].children;
  console.log(children);
  for (const child of children) {
    console.log();
    leaderboard.push({
      index: child[3].children[3].children[0][3].children ?? -1,
      name: child[3].children[3].children[1][3].children[1] || "Idk",
      treasure: child[3].children[3].children[2][3].children[0] || -1,
    });
  }

  return leaderboard;
}

export function getLB() {
  return fetch("https://rpg.hackclub.com/leaderboard", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      priority: "u=0, i",
      "sec-ch-ua": '"Chromium";v="133", "Not(A:Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      cookie: process.env.RPGYSWS_COOKIE!,
    },
  })
    .then((r) => r.text())
    .then((d) => {
      const scriptTags = d.split("<script>").slice(1);
      return parseScriptMoment(
        scriptTags
          .find((e) => e.includes("Leaderboard"))
          .split("</script>")[0]
          .split("\\")
          .join(""),
      );
    });
}

export function cronJobForRPG(app: ModifiedApp) {
  new Cron("0 0 * * *", async () => {
    getLB().then((d) => {
      app.db.set("rpg_lb", d);
    });
  });
}
