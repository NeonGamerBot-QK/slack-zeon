import "dotenv/config";
import "./modules/sentry";
import * as Sentry from "@sentry/node";
import init from "./modules/watch-git";
// import "./modules/smee"
import app from "./modules/slackapp";
import { View } from "@slack/bolt";
import Loader from "./modules/CommandLoader";
import path from "path";
import JSONdb from "simple-json-db";
import cron from "node-cron";
import { getJellyfinStatus, getSpotifyStatus } from "./modules/status";
import { getResponse } from "./modules/randomResponseSystem";
import * as utils from "./modules/index";
import howWasYourDay, {
  cached_spotify_songs,
  resetSpotifyCache,
} from "./modules/howWasYourDay";
import { PrivateDNS } from "./modules/nextdns";
import { attachDB } from "./modules/projectWaterydo";
import { getTodaysEvents } from "./modules/hw";
import { watchForWhenIUseHacktime } from "./modules/hacktime";
const cronWithCheckIn = Sentry.cron.instrumentNodeCron(cron);

const db = new JSONdb("data/data.json");
app.dbs = {};
app.dbs.bday = new JSONdb("data/bday.json");
attachDB(db);
app.start(process.env.PORT || 3000).then(async (d) => {
  console.log(`App is UP (please help)`);
  watchForWhenIUseHacktime(app);
  setInterval(() => {
    try {
      function r() {
        fetch(
          "https://uptime.saahild.com/api/push/DioNHIGz58?status=up&msg=OK&ping=",
        ).catch(() => {
          setTimeout(r, 5000);
        });
      }
      r();
    } catch (e) {
      console.error(e);
    }
  }, 60_000);
  app.client.chat.postMessage({
    channel: `D07LBMXD9FF`,
    text: `Starting Slack Bot :D`,
  });
  init(app);
  PrivateDNS(app, process.env.MY_NEXTDNS, `C07LT7XS28Z`);
  PrivateDNS(app, process.env.HACKCLUB_NEXTDNS, `C07TWGJKK98`);
  // grab spotify cache from db
  resetSpotifyCache(app);
});
// app.client.cha
const cmdLoader = new Loader(app, path.join(__dirname, "commands"));
// this is temp i swear
cmdLoader.runQuery();

app.db = db;
app.utils = utils;

function handleError(e: any) {
  console.error(e);
  Sentry.captureException(e);
  try {
    app.client.chat.postMessage({
      channel: `D07LBMXD9FF`,
      text: `**Error:**\n\`\`\`${e.stack}\`\`\``,
    });
  } catch (e) {}
}
function updateStatus(emoji: string, str: string, clearStats?: boolean) {
  Sentry.startSpan(
    {
      op: "prod",
      name: "Update Status",
    },
    () => {
      // Sentry.profiler.startProfiler();
      app.client.users.profile.set({
        //@ts-ignore
        profile: clearStats
          ? {
              status_emoji: "",
              status_text: "",
            }
          : {
              status_emoji: emoji,
              status_expiration: 0,
              status_text: str.slice(0, 100),
            },
        token: process.env.MY_SLACK_TOKEN,
      });
    },
  );
  // Sentry.profiler.stopProfiler();
}
cron.schedule("* * * * *", async () => {
  Sentry.profiler.startProfiler();
  //TODO: Add custom PFP's for music (cuz headphones would be nice)
  const jellyfinStr = await getJellyfinStatus();
  const spotifyStr = await getSpotifyStatus();
  if (jellyfinStr) {
    updateStatus(":jellyfin:", jellyfinStr);
  } else if (spotifyStr) {
    cached_spotify_songs.push(spotifyStr);
    app.db.set("spotify_songs", cached_spotify_songs);
    updateStatus(":new_spotify:", spotifyStr);
  } else {
    // clear status
    updateStatus(
      ":trash:",
      "Zeons cleaning up neons status.. ignore this",
      true,
    );
  }
  Sentry.profiler.stopProfiler();
  //TODO ADD MORE RPC
  // at home? at school?
  // set away if in any focus mode
});
async function sendRandomStuff() {
  Sentry.startSpan(
    {
      op: "prod",
      name: "Send Random Stuff",
    },
    async () => {
      // dont send bot after bot ...
      const lastMessage = await app.client.conversations
        .history({
          channel: "C07R8DYAZMM",
        })
        .then((e) => e.messages[0]);
      if (lastMessage.user === "U07LEF1PBTM") return; // ^^
      app.client.chat.postMessage({
        channel: "C07R8DYAZMM",
        //@ts-ignore
        text: await getResponse(db),
      });
    },
  );
}
//utils.startWatchingDirectory(app);
cron.schedule("5 */12 * * *", sendRandomStuff);
cron.schedule("25 */22 * * *", sendRandomStuff);
cron.schedule("15 */3 * * *", sendRandomStuff);
cron.schedule("45 2 */2 * *", sendRandomStuff);
cronWithCheckIn.schedule(
  "35 21 * * *",
  async () => {
    await howWasYourDay(app);
  },
  { name: "howwasmyday" },
);
cronWithCheckIn.schedule(
  "1 7 * * 1-5",
  async () => {
    const hw = await getTodaysEvents().then((e: any) => {
      const start = [];
      const end = [];
      //@ts-ignore
      e.forEach((e) => {
        if (e.assign_type == "start") start.push(e.summary);
        if (e.assign_type == "end") end.push(e.summary);
      });
      if (start.length > 0 || end.length > 0) {
        return `Assigned today:\n> ${start.join("\n> ")}\n*Due Today*\n> ${end.join("\n> ")}`;
      } else {
        return `No HW found :yay:`;
      }
    });
    app.client.chat.postMessage({
      channel: "C07R8DYAZMM",
      //@ts-ignore
      text: `Good Morning :D! Wake up <@${process.env.MY_USER_ID}> your ass needs to get ready for school now!.\n> ${hw}`,
    });
  },
  { name: "morning-weekday" },
);
// special cron
cronWithCheckIn.schedule(
  "1 9 * * 6-7",
  () => {
    const d = new Date();
    if (![6, 7].includes(d.getDay())) return;
    const isSaturday = d.getDay() === 6;
    app.client.chat.postMessage({
      channel: "C07R8DYAZMM",
      //@ts-ignore
      text: `Good Morning :D! dont wake up since i bet ur ass only went to sleep like 4 hours ago :P.${isSaturday ? "\n> You should be at robotics tho..." : ""}`,
    });
  },
  { name: "morning-weekend" },
);
// only for the month of december every day at 11pm
cron.schedule("0 23 * 12 *", async () => {
  //@ts-ignore
  app.utils.adventOfCode.default(app, `C01GF9987SL`);
});
cron.schedule("0 0 * 12 *", () => {
  app.utils.adventOfCode.newDayNewChallange(app, `C01GF9987SL`);
});
cron.schedule("* * * * *", async () => {
  const allUsersWithAShipmentURL = Object.keys(app.db.JSON()).filter((e) =>
    e.startsWith(`shipment_url_`),
  );
  if (allUsersWithAShipmentURL.length > 0) {
    for (const userURLID of allUsersWithAShipmentURL) {
      console.log(userURLID);
      const shipments = await app.utils.hcshipments.parseShipments(
        app.db.get(userURLID),
      );
      await app.db.set(
        `shipments_${userURLID.replace(`shipment_url_`, ``)}`,
        shipments,
      );
    }
  }
});
process.on("unhandledRejection", handleError);
process.on("unhandledException", handleError);
