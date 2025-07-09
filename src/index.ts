console.time(`Loading modules`);
console.time("Dotenv");
import "dotenv/config";
console.timeEnd("Dotenv");
console.time("Sentry");
import "./modules/sentry";
console.timeLog("Sentry", "Sentry loaded");
import * as Sentry from "@sentry/node";
console.timeEnd("Sentry");
console.time("Nocodb");
import { Api } from "nocodb-sdk";
console.timeEnd("Nocodb");
console.time("GitWatcher");
import init from "./modules/watch-git";
console.timeEnd("GitWatcher");
console.time("SlackBot");
// import "./modules/smee"
import app from "./modules/slackapp";
// import Keyv from "keyv";
// import { View } from "@slack/bolt";
console.timeEnd("SlackBot");
console.time("Loader");
import Loader from "./modules/CommandLoader";
console.timeEnd("Loader");
console.time("path");
import path from "path";
console.timeEnd("path");
console.time("simple-json-db");
import JSONdb from "simple-json-db";
console.timeEnd("simple-json-db");
console.log(`Suspected cause:`);
console.time("Utils");
import * as utils from "./modules/index";
console.timeEnd("Utils");
console.time("Modules-resetSpotifyCache");
import { resetSpotifyCache } from "./modules/howWasYourDay";
console.timeEnd("Modules-resetSpotifyCache");
console.time("Modules-attachDB");
import { attachDB } from "./modules/projectWaterydo";
console.timeEnd("Modules-attachDB");
console.time("Modules-monitorMemCpu");
import monitorMemCpu from "./modules/alertcpu";
console.timeEnd("Modules-monitorMemCpu");
console.time("watchForWhenIUseHacktime");
import { watchForWhenIUseHacktime } from "./modules/hacktime";
console.timeEnd("watchForWhenIUseHacktime");
// console.timeLog("SqliteKeyv")
// import KeyvSqlite from "@keyv/sqlite";
// console.timeEnd("SqliteKeyv")
console.time("EncJson");
import { EncryptedJsonDb } from "./modules/encrypted-db";
console.timeEnd("EncJson");
console.time("Cron");
import { setupOverallCron } from "./modules/cron";
console.timeEnd("Cron");
console.time("WatchMem");
import watchMem from "./modules/memwatch";
console.timeEnd("WatchMem");
console.time("logsnag");
import { LogSnag } from "@logsnag/node";
console.timeEnd("logsnag");

console.timeEnd(`Loading modules`);

// Save original fetch
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (...args) {
  const [url] = args;
  try {
    //@ts-ignore
    const res = await originalFetch(...args);
    if (!res.ok) {
      console.warn(`Fetch to ${url} returned status ${res.status}`);
    }
    return res;
  } catch (error) {
    console.error(`Global fetch failed for URL: ${url}`);
    error.message += ` (while fetching ${url})`;
    throw error;
  }
};

console.log(`Loading db's`);
console.time(`Loading db's`);
const db = new JSONdb("data/data.json");
// const keyvSqlite = new KeyvSqlite("sqlite://data/main.db");
app.dbs = {};
app.kdbs = {};
// app.dbs.bday = new JSONdb("data/bday.json");
// im so sorry this db is going to fill up so fast as each entry is arround 116kb
app.dbs.ddm = new JSONdb("data/discord-datamining.json");
app.dbs.channelhoisterdb = new JSONdb("data/channel-hoister.json");
app.dbs.memdebug = new JSONdb("data/memdb.json");
// app.dbs.seven39 = new JSONdb("data/739.json");
app.dbs.flightly = new JSONdb("data/flightly.json");
app.dbs.journey = new JSONdb("data/journey.json");
app.dbs.anondm = new EncryptedJsonDb("data/anondm.json", {
  password: process.env.ANONDM_PASSWORD,
});
// easy migration for just this db.
app.dbs.mykcd = new JSONdb("data/mykcd.json");
app.dbs.tags = new JSONdb("data/tags.json");
app.dbs.stickymessages = new JSONdb("data/stickymessages.json");
// app.dbs.thething = new JSONdb("data/the-thing-hc.json");
// app.kdbs.yswsdb = new Keyv({ store: keyvSqlite, namespace: "yswsdb" });
console.debug(`Dbs loaded`);
console.timeEnd(`Loading db's`);
app.db = db;
app.utils = utils;
app.nocodb = new Api({
  baseURL: process.env.NOCODB_URL!,
  headers: {
    "xc-token": process.env.NOCODB_TOKEN!,
  },
});
attachDB(db);
watchMem(app);

const logsnag = new LogSnag({
  token: process.env.LOGSNAG_TOKEN!,
  project: "slack-zeon",
});
app.logsnag = logsnag;
// app.client.cha
const cmdLoader = new Loader(app, path.join(__dirname, "commands"));
// this is temp i swear
cmdLoader.runQuery();

function handleError(e: any) {
  console.error(e);
  try {
    Sentry.captureException(e);
  } catch (e) {
    console.error(`rip sentry (died while tryna report an error)`);
  }
  try {
    app.client.chat.postMessage({
      channel: `D07LBMXD9FF`,
      text: `**Error:**\n\`\`\`${e.stack}\`\`\``,
    });
  } catch (e) {}
}
process.on("unhandledRejection", handleError);
process.on("unhandledException", handleError);

// cron might be eating the cpu
setupOverallCron(app);
// im going parinoiddd
// cron.schedule(
//   "30 21 * * *",
//   async () => {
//     try {
//       await howWasYourDay(app);
//     } catch (e: any) {
//       // uh guess what this doesnt run because this cron doesnt run ...
//       app.client.chat.postMessage({
//         channel: `C07R8DYAZMM`,
//         text: `So i was supposed to say How was your day neon right?? well guess what neon broke my damn code!! so he gets to deal with this shitty error: \`\`\`\n${e.stack}\`\`\``,
//       });
//     }
//   },
//   { name: "howwasmyday" },
// );
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
      console.error(e, `uptime`);
    }
  }, 60_000);
  app.client.chat.postMessage({
    channel: `D07LBMXD9FF`,
    text: `Starting Slack Bot :D`,
  });
  init(app);
  monitorMemCpu(app);
  // grab spotify cache from db
  resetSpotifyCache(app);
  app.client.chat.postMessage({
    channel: `C07LEEB50KD`,
    text: `Im up and running :3`,
  });
});
process.on("SIGINT", async () => {
  try {
    await app.client.chat.postMessage({
      channel: `C07LEEB50KD`,
      text: `I was up for \`${process.uptime()}\` seconds :3 its now time for my leave`,
    });
  } catch (e) {
    console.error(`Slack dont wana work >:3`);
  } finally {
    process.exit(0);
  }
});
