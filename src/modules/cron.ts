import { ModifiedApp } from "./slackapp";
import { getJellyfinStatus, getSpotifyStatus } from "./status";
import { getResponse } from "./randomResponseSystem";
import { getTodaysEvents } from "./hw";
import { startBdayCron } from "./bday";
import { getAdventOfCodeLb, setupCronAdventOfCode } from "./adventofcode";

import { setupCronForShipments } from "./parseShipments";
import { setupCronForIrl } from "./watchMyIrl";
import * as Sentry from "@sentry/node";
import cron from "node-cron";
import howWasYourDay, { cached_spotify_songs } from "./howWasYourDay";
import { highSeasCron } from "./highseas";

const cronWithCheckIn = Sentry.cron.instrumentNodeCron(cron);

function updateStatus(
  emoji: string,
  str: string,
  app: ModifiedApp,
  clearStats?: boolean,
) {
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

export function setupOverallCron(app: ModifiedApp) {
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
          text: await getResponse(app.db),
        });
      },
    );
  }
  //utils.startWatchingDirectory(app);
  cron.schedule("5 */12 * * *", sendRandomStuff);
  cron.schedule("25 */22 * * *", sendRandomStuff);
  cron.schedule("15 */3 * * *", sendRandomStuff);
  cron.schedule("45 2 */2 * *", sendRandomStuff);
  cron.schedule("* * * * *", async () => {
    Sentry.profiler.startProfiler();
    //TODO: Add custom PFP's for music (cuz headphones would be nice)
    const jellyfinStr = await getJellyfinStatus();
    const spotifyStr = await getSpotifyStatus();
    if (jellyfinStr) {
      updateStatus(":jellyfin:", jellyfinStr, app);
    } else if (spotifyStr) {
      cached_spotify_songs.push(spotifyStr);
      app.db.set("spotify_songs", cached_spotify_songs);
      updateStatus(":new_spotify:", spotifyStr, app);
    } else {
      // clear status
      updateStatus(
        ":trash:",
        "Zeons cleaning up neons status.. ignore this",
        app,
        true,
      );
    }
    Sentry.profiler.stopProfiler();
    //TODO ADD MORE RPC
    // at home? at school?
    // set away if in any focus mode
  });
  cronWithCheckIn.schedule(
    "30 21 * * *",
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

  
  cron.schedule("0 * * * *", async () => {
    fetch("https://min-api.cryptocompare.com/data/price?fsym=XMR&tsyms=USD")
      .then((r) => r.json())
      .then((d) => {
        console.log(d.USD);
        const newMoneroPrice = d.USD;
        const oldMoneroPrice = app.db.get(`monero_price`) || 0;
        if (newMoneroPrice !== oldMoneroPrice) {
          app.db.set(`monero_price`, newMoneroPrice);
          //@ts-ignore
          const myNewBalance = process.env.MONERO_BALANCE * newMoneroPrice;
          app.client.chat.postMessage({
            text: `*Monero* :3\n:monero: \`${oldMoneroPrice}$\` -> \`${newMoneroPrice}$\` :monero: (diff \`${newMoneroPrice - oldMoneroPrice}\` :monero:)\n> You now have \`${myNewBalance}$\` in monero`,
            channel: `C07LGLUTNH2`,
          });
        }
      });
  });
  setupCronForShipments(app);
  startBdayCron(app);
  setupCronAdventOfCode(app);
  setupCronForIrl(app);
  highSeasCron(app)
}
