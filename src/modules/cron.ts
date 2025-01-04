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
  cron.schedule(
    "30 21 * * *",
    async () => {
      try {
        await howWasYourDay(app);
      } catch (e: any) {
        app.client.chat.postMessage({
          channel: `C07R8DYAZMM`,
          text: `So i was supposed to say How was your day neon right?? well guess what neon broke my damn code!! so he gets to deal with this shitty error: \`\`\`\n${e.stack}\`\`\``,
        });
      }
    },
    // ,{ name: "howwasmyday" },
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
  cron.schedule("*/5 * * * *", async () => {
    try {
      // idgaf about the temp creds
      const temp1 = await fetch(
        "https://airtable.com/v0.3/application/app05mIKwNPO2l1vT/readForSharedPages?stringifiedObjectParams=%7B%22includeDataForPageId%22%3A%22pagVJtLdaiiXaC2D1%22%2C%22shouldIncludeSchemaChecksum%22%3Atrue%2C%22expectedPageLayoutSchemaVersion%22%3A26%2C%22shouldPreloadQueries%22%3Atrue%2C%22shouldPreloadAllPossibleContainerElementQueries%22%3Atrue%2C%22urlSearch%22%3A%22%22%2C%22includeDataForExpandedRowPageFromQueryContainer%22%3Atrue%2C%22includeDataForAllReferencedExpandedRowPagesInLayout%22%3Atrue%2C%22navigationMode%22%3A%22view%22%7D&requestId=reqFv03qxbFJ1EvG3&accessPolicy=%7B%22allowedActions%22%3A%5B%7B%22modelClassName%22%3A%22page%22%2C%22modelIdSelector%22%3A%22pagVJtLdaiiXaC2D1%22%2C%22action%22%3A%22read%22%7D%2C%7B%22modelClassName%22%3A%22application%22%2C%22modelIdSelector%22%3A%22app05mIKwNPO2l1vT%22%2C%22action%22%3A%22readForSharedPages%22%7D%2C%7B%22modelClassName%22%3A%22application%22%2C%22modelIdSelector%22%3A%22app05mIKwNPO2l1vT%22%2C%22action%22%3A%22readSignedAttachmentUrls%22%7D%5D%2C%22shareId%22%3A%22shrGTZVv0GaS4S4Kk%22%2C%22applicationId%22%3A%22app05mIKwNPO2l1vT%22%2C%22generationNumber%22%3A0%2C%22expires%22%3A%222025-01-16T00%3A00%3A00.000Z%22%2C%22signature%22%3A%224f4dbc48cdc6b374bbfabbf76ed184ba98199a8d477be155faf31245759aa32c%22%7D",
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            priority: "u=1, i",
            "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Linux"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            traceparent:
              "00-9a610257b783af35181583178af1941f-787c534b9b6893c8-01",
            tracestate: "",
            "x-airtable-application-id": "app05mIKwNPO2l1vT",
            "x-airtable-client-queue-time": "2.099999999627471",
            "x-airtable-inter-service-client": "webClient",
            "x-airtable-inter-service-client-code-version":
              "0172c9229aae27099ae617d13157821608d409b8",
            "x-airtable-page-load-id": "pglaBXe7VtCOj5efS",
            "x-requested-with": "XMLHttpRequest",
            "x-time-zone": "America/New_York",
            "x-user-locale": "en",
          },
          referrerPolicy: "no-referrer",
          body: null,
          method: "GET",
          mode: "cors",
          credentials: "include",
        },
      ).then((r) => r.json());

      //@ts-ignore
      const json = Object.values(
        temp1.data.preloadPageQueryResults.tableDataById.tblVV0tpvZnQWcsH4
          .partialRowById,
      )
        .map((e: any) => e.cellValuesByColumnId)
        .map((e: any) => {
          let s = undefined;
          if (e.fld7qAcn49vVKJ4xc) {
            if (e.fld7qAcn49vVKJ4xc == "selbAbSmkPk9XiuTc") {
              s = "approved";
            }
            if (e.fld7qAcn49vVKJ4xc == "seleUd0UfZzubrPKs") {
              s = "being reviewed";
            }
            if (e.fld7qAcn49vVKJ4xc == "selDYo16Asoc7dxkr") {
              s = "ordered";
            }
          }
          return {
            name: e.fldeAMpKMvhiFAokN,
            url: e.fldiQTbHOJ4Smo2Cx,
            status: s,
          };
        }) as any[];
      const myInstance = json.find((e: any) =>
        e.url.toLowerCase().includes("neongamerbot"),
      );
      const myDbInstance = app.db.get("boba_status") || null;
      if (!myDbInstance) {
        await app.client.chat.postMessage({
          channel: "C07R8DYAZMM",
          text: `:christmas_tree::snowflake::gift::cup_with_straw: *Winter boba status*: ${myInstance.status || "Non existent"}`,
        });
      } else if (myDbInstance !== myInstance.status && myInstance.status) {
        await app.client.chat.postMessage({
          channel: "C07R8DYAZMM",
          text: `:christmas_tree::snowflake::gift::cup_with_straw: *Winter boba status updated*: ${myInstance.status || "Non existent"}`,
        });
      }
      app.db.set("boba_status", myInstance.status || "N/A");
    } catch (e: any) {
      app.client.chat.postMessage({
        channel: process.env.MY_USER_ID,
        text: `so the airtable automation broke\n${e.stack || e.message}`,
      });
    }
  });
  setupCronForShipments(app);
  startBdayCron(app);
  setupCronAdventOfCode(app);
  setupCronForIrl(app);
  highSeasCron(app);
}
