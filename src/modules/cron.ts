import { ModifiedApp } from "./slackapp";
import { getJellyfinStatus, getSpotifyStatus } from "./status";
import { getResponse } from "./randomResponseSystem";
import { getTodaysEvents } from "./hw";
import { startBdayCron } from "./bday";
import { cronJobForYSWS } from "./theyswsdb";
import { setupCronForShipments } from "./parseShipments";
import { setupCronForIrl } from "./watchMyIrl";
import * as Sentry from "@sentry/node";
import cron from "node-cron";
import howWasYourDay, { cached_spotify_songs } from "./howWasYourDay";
import { Cron } from "croner";
import { tempcronjob } from "./school";
import { setupFlightlyCron } from "./flightly";
import { ActualCronForJourney } from "./journey";
import { setupShipwrecked } from "./shipwrecked";
import { whosHackingCron } from "./hacktime";
import { scrapeStuff } from "./noramail";
// import { onLoad } from "./lockinysws";
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

export async function setupOverallCron(app: ModifiedApp) {
  const CurrentTimeZone = await app.db.get("tz")
    ? (await app.db.get("tz")).tz
    : "America/New_York";
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
          text: await getResponse(app),
        });
      },
    );
  }
  //utils.startWatchingDirectory(app);
  cron.schedule("5 */12 * * *", sendRandomStuff);
  cron.schedule("25 */22 * * *", sendRandomStuff);
  new Cron("15 */3 * * *", sendRandomStuff);
  new Cron("45 2 */2 * *", sendRandomStuff);
  new Cron("* * * * *", async () => {
    // Sentry.profiler.startProfiler();
    //TODO: Add custom PFP's for music (cuz headphones would be nice)
    const jellyfinStr = await getJellyfinStatus();
    const spotifyStr = await getSpotifyStatus();
    if (jellyfinStr) {
      updateStatus(":jellyfin:", jellyfinStr, app);
    } else if (spotifyStr) {
      cached_spotify_songs.push(spotifyStr);
      await app.db.set("spotify_songs", cached_spotify_songs);
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
    // Sentry.profiler.stopProfiler();
    //TODO ADD MORE RPC
    // at home? at school?
    // set away if in any focus mode
  });
  try {
    const job = new Cron(
      "40 21 * * *",
      async () => {
        try {
          await howWasYourDay(app);
        } catch (e: any) {
          // uh guess what this doesnt run because this cron doesnt run ...
          app.client.chat.postMessage({
            channel: `C07R8DYAZMM`,
            text: `So i was supposed to say How was your day neon right?? well guess what neon broke my damn code!! so he gets to deal with this shitty error: \`\`\`\n${e.stack}\`\`\``,
          });
        }
      },
      {
        timezone: CurrentTimeZone,
      },
      // { name: "howwasmyday" },
    );
  } catch (e) {
    app.client.chat.postMessage({
      channel: `C07R8DYAZMM`,
      text: `So i was supposed to say How was your day neon right?? well guess what neon broke my damn code!! so he gets to deal with this shitty error: \`\`\`\n${e.stack}\`\`\``,
    });
  }
  cron.schedule(
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
    { name: "morning-weekday", timezone: CurrentTimeZone },
  );
  // special cron
  cron.schedule(
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
    { name: "morning-weekend", timezone: CurrentTimeZone },
  );

  const moneroJob = new Cron("0 * * * *", async () => {
    fetch("https://min-api.cryptocompare.com/data/price?fsym=XMR&tsyms=USD")
      .then((r) => r.json())
      .then(async (d) => {
        console.log(d.USD);
        const newMoneroPrice = d.USD;
        const oldMoneroPrice = await app.db.get(`monero_price`) || 0;
        if (newMoneroPrice !== oldMoneroPrice) {
          await app.db.set(`monero_price`, newMoneroPrice);
          //@ts-ignore
          const myNewBalance = process.env.MONERO_BALANCE * newMoneroPrice;
          app.client.chat.postMessage({
            text: `*Monero* :3\n:monero: \`${oldMoneroPrice}$\` -> \`${newMoneroPrice}$\` :monero: (diff \`${newMoneroPrice - oldMoneroPrice}\` :monero:)\n> You now have \`${myNewBalance}$\` in monero`,
            channel: `C07LGLUTNH2`,
          });
        }
      });
  });
  const dailyPkgCheckCron = new Cron(
    "0 12 * * *",
    async () => {
      const filterPkgs = (str) =>
        !["chart.js", "node-fetch"].some((w) => str.includes(w));
      const out = require("child_process")
        .execSync('yarn outdated || echo ""')
        .toString()
        .split("\n")
        .slice(6)
        .filter(filterPkgs)
        .map((e) => {
          const splits = e.split(/ +/);
          return {
            name: splits[0],
            currentVersion: splits[1],
            wantedVersion: splits[2],
            latestVersion: splits[3],
            PkgType: splits[4],
            url: splits[5],
          };
        })
        .filter((e) => e.latestVersion);
      const pkgsString = out
        .map(
          (e) =>
            `<https://npmjs.com/${e.name}|${e.name}> - \`${e.currentVersion}\` -> \`${e.latestVersion}\` (min: ${e.wantedVersion})`,
        )
        .join("\n");
      app.client.chat.postMessage({
        text: `:npm: Daily noon package check ;p you need to update ${out.length} packages! here is a list:\n${pkgsString}`,
        channel: `C07LEEB50KD`,
      });
    },
    { timezone: CurrentTimeZone },
  );
  // const checkAirtableBoba = new Cron("*/15 * * * *", async () => {
  //   try {
  //     // idgaf about the temp creds
  //     const temp1 = await fetch(
  //       "https://airtable.com/v0.3/application/app05mIKwNPO2l1vT/readForSharedPages?stringifiedObjectParams=%7B%22includeDataForPageId%22%3A%22pagVJtLdaiiXaC2D1%22%2C%22shouldIncludeSchemaChecksum%22%3Atrue%2C%22expectedPageLayoutSchemaVersion%22%3A26%2C%22shouldPreloadQueries%22%3Atrue%2C%22shouldPreloadAllPossibleContainerElementQueries%22%3Atrue%2C%22urlSearch%22%3A%22%22%2C%22includeDataForExpandedRowPageFromQueryContainer%22%3Atrue%2C%22includeDataForAllReferencedExpandedRowPagesInLayout%22%3Atrue%2C%22navigationMode%22%3A%22view%22%7D&requestId=reqOkjBOX34VNPINe&accessPolicy=%7B%22allowedActions%22%3A%5B%7B%22modelClassName%22%3A%22page%22%2C%22modelIdSelector%22%3A%22pagVJtLdaiiXaC2D1%22%2C%22action%22%3A%22read%22%7D%2C%7B%22modelClassName%22%3A%22application%22%2C%22modelIdSelector%22%3A%22app05mIKwNPO2l1vT%22%2C%22action%22%3A%22readForSharedPages%22%7D%2C%7B%22modelClassName%22%3A%22application%22%2C%22modelIdSelector%22%3A%22app05mIKwNPO2l1vT%22%2C%22action%22%3A%22readSignedAttachmentUrls%22%7D%5D%2C%22shareId%22%3A%22shrGTZVv0GaS4S4Kk%22%2C%22applicationId%22%3A%22app05mIKwNPO2l1vT%22%2C%22generationNumber%22%3A0%2C%22expires%22%3A%222025-02-13T00%3A00%3A00.000Z%22%2C%22signature%22%3A%22a72b1a25e034a6600fcbce501d6ebba67b7a0bf888538604aa227ea51cbdd3dd%22%7D",
  //       {
  //         headers: {
  //           "x-airtable-inter-service-client": "webClient",
  //           "sec-ch-ua-platform": '"Linux"',
  //           "x-airtable-inter-service-client-code-version":
  //             "16c9ba318d59b9179baf308a61decbf1a9096e51",
  //           "x-airtable-page-load-id": "pgl7kQeLDDcmD28eW",
  //           "x-airtable-application-id": "app05mIKwNPO2l1vT",
  //           "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
  //           "x-time-zone": "America/New_York",
  //           "sec-ch-ua-mobile": "?0",
  //           traceparent:
  //             "00-8a94a47d3e5b2a68b213f60dd51719a2-e942490da9f51df7-01",
  //           "X-Requested-With": "XMLHttpRequest",
  //           Accept: "application/json, text/javascript, */*; q=0.01",
  //           "x-airtable-client-queue-time": "2.600000001490116",
  //           tracestate: "",
  //           Referer: "",
  //           "x-user-locale": "en",
  //           "User-Agent":
  //             "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  //         },
  //       },
  //     ).then((r) => r.json());

  //     //@ts-ignore
  //     const json = Object.values(
  //       temp1.data.preloadPageQueryResults.tableDataById.tblVV0tpvZnQWcsH4
  //         .partialRowById,
  //     )
  //       .map((e: any) => e.cellValuesByColumnId)
  //       .map((e: any) => {
  //         let s = undefined;
  //         if (e.fld7qAcn49vVKJ4xc) {
  //           if (e.fld7qAcn49vVKJ4xc == "selbAbSmkPk9XiuTc") {
  //             s = "approved";
  //           }
  //           if (e.fld7qAcn49vVKJ4xc == "seleUd0UfZzubrPKs") {
  //             s = "being reviewed";
  //           }
  //           if (e.fld7qAcn49vVKJ4xc == "selDYo16Asoc7dxkr") {
  //             s = "ordered";
  //           }
  //         }
  //         return {
  //           name: e.fldeAMpKMvhiFAokN,
  //           url: e.fldiQTbHOJ4Smo2Cx,
  //           status: s,
  //         };
  //       }) as any[];
  //     const myInstance = json.find((e: any) =>
  //       e.url.toLowerCase().includes("neongamerbot"),
  //     );
  //     const myDbInstance = app.db.get("boba_status") || null;
  //     if (!myDbInstance) {
  //       await app.client.chat.postMessage({
  //         channel: "C07R8DYAZMM",
  //         text: `:christmas_tree::snowflake::gift::cup_with_straw: *Winter boba status*: ${myInstance.status || "Non existent"}`,
  //       });
  //     } else if (myDbInstance !== myInstance.status && myInstance.status) {
  //       await app.client.chat.postMessage({
  //         channel: "C07R8DYAZMM",
  //         text: `:christmas_tree::snowflake::gift::cup_with_straw: *Winter boba status updated*: ${myInstance.status || "Non existent"}`,
  //       });
  //     }
  //     app.db.set("boba_status", myInstance.status || "N/A");
  //   } catch (e: any) {
  //     app.client.chat.postMessage({
  //       channel: process.env.MY_USER_ID,
  //       text: `so the airtable automation broke\n${e.stack || e.message}`,
  //     });
  //   }
  // });
  // setupCronForShipments(app);
  startBdayCron(app);
  // setupCronAdventOfCode(app);
  setupCronForIrl(app);
  // setupCron(app);
  // highSeasCron(app);
  // temp? nah perm now
  tempcronjob(app);
  // cronJobFor15daysofcode(app);
  // setupSeverCron(app);
  // cronJobForRPG(app);
  // onLoadForLockIn(app);
  setupFlightlyCron(app);
  // cronJobForAvatar();
  // cronTS(app);
  // perm disabled
  //  ActualCronForJourney(app);
  // setupShipwrecked(app);
  scrapeStuff(app);
  // setInterval(
  //   async () => {
  //     interface RootInterface {
  //       success: boolean;
  //       records: Record[];
  //     }

  //     interface Record {
  //       id: string;
  //       createdTime: string;
  //       fields: Fields;
  //     }

  //     interface Fields {
  //       Task: string;
  //     }
  //     const data = await fetch("https://tonic.hackclub.com/scraps", {
  //       headers: {
  //         "user-agent":
  //           "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  //         cookie: "uid=U07L45W79E1",
  //       },
  //     })
  //       .then((r) => r.json())
  //       .then((d) => d as RootInterface);
  //     if (data.success) {
  //       const storedIds = app.db.get("tonic_scraps") || [];
  //       const newIds = data.records
  //         .filter((r) => !storedIds.includes(r.id))
  //         .map((r) => r.id);

  //       for (const id of newIds) {
  //         if (storedIds.includes(id)) continue;
  //         app.client.chat.postMessage({
  //           text: `:ms_grinning: new tonic scrap! you just completed: ${data.records.find((r) => r.id === id).fields.Task}`,
  //           channel: "C07R8DYAZMM",
  //         });
  //         await new Promise((r) => setTimeout(r, 100));
  //       }
  //       app.db.set("tonic_scraps", storedIds.concat(newIds));
  //     }
  //   },
  //   1000 * 60 * 5,
  // );
  // cronJobForYSWS(app);
  //  whosHackingCron(app);
  return {
    // checkAirtableBoba,
    cronWithCheckIn,
    moneroJob,
    sendRandomStuff,
    dailyPkgCheckCron,
  };
}
