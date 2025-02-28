import { Cron } from "croner";
import { ModifiedApp } from "./slackapp";

// time to get fudge pt 2
interface Post {
  timestamp: number;
  content: string;
}
interface Leaderboard {
  user: string;
  posts: Post[];
}
export interface RootObjectFor15Response {
  leaderboard: Leaderboard[];
}
export function parseTextAndExtractUsers(text: string) {
  return text
    .split("|--------------------")[2]
    .split("\n")
    .filter(Boolean)
    .map((e) =>
      e
        .split("|")
        .filter(Boolean)
        .map((d) => d.trim().replace("✓ ", "")),
    )
    .filter((e) => e.length > 1)
    .map((d) => {
      return {
        username: d[0],
        days: d.slice(1).filter(Boolean),
      };
    })
    .filter((e) => !e.username.startsWith("---"));
}
export function getMetaInfo(text: string) {
  const [Rstatus, Rwrote] = text
    .split("-------------------\nEND OF TRANSMISSION")[1]
    .split("---")[0]
    .split("\n")
    .filter(Boolean);
  return {
    status: Rstatus.split(" ")[1],
    wrote: Rwrote.split(":")[1].trim(),
  };
}
export async function getUsers() {
  // this will take a hot sec
  const response = await fetch("https://daysinpublic.blaisee.me/")
    .then((r) => r.json())
    .then((d) => (d as RootObjectFor15Response).leaderboard);
  return response;
}

export function diffStrings(oldArray: Leaderboard[], newArray: Leaderboard[]) {
  const strings = [];
  for (const user of newArray) {
    const oldUser = oldArray.find((e) => e.user === user.user);
    if (!oldUser) {
      strings.push(`✓ ${user.user} has started there first day!`);
      continue;
    }
    const daysDiffLength = user.posts.length - oldUser.posts.length;
    if (daysDiffLength > 0) {
      strings.push(
        `:yay: ${user.user} has is now at ${user.posts.length} days!`,
      );
    }
  }
  return strings;
}
export async function cronMoment(app: ModifiedApp) {
  const oldData = app.db.get("15daysofcode") || [];
  const data = await getUsers();
  const strings = diffStrings(oldData, data);
  app.db.set("15daysofcode", data);
  if (strings.length > 0) {
    // diff moment
    app.client.chat.postMessage({
      channel: `C045S4393CY`,
      thread_ts: `1740283783.721689`,
      text: `Diff for \`${new Date().toISOString()}\` (EST)\n\n${strings.join("\n")}`,
    });
  }
}
export function cronJobFor15daysofcode(app: ModifiedApp) {
  new Cron("*/15 * * * *", async () => {
    try {
      await cronMoment(app);

    } catch (e) {
      console.error(e)
}
  });
}
