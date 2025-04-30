import "dotenv/config";
import "./modules/sentry";
import * as Sentry from "@sentry/node";
import { Api } from "nocodb-sdk";
import init from "./modules/watch-git";
// import "./modules/smee"
import app from "./modules/slackapp";
// import Keyv from "keyv";
// import { View } from "@slack/bolt";
import Loader from "./modules/CommandLoader";
import path from "path";
import JSONdb from "simple-json-db";
import * as utils from "./modules/index";
import { resetSpotifyCache } from "./modules/howWasYourDay";
import { PrivateDNS } from "./modules/nextdns";
import { attachDB } from "./modules/projectWaterydo";
import monitorMemCpu from "./modules/alertcpu";
import { watchForWhenIUseHacktime } from "./modules/hacktime";
import KeyvSqlite from "@keyv/sqlite";
import { EncryptedJsonDb } from "./modules/encrypted-db";
import { setupOverallCron } from "./modules/cron";
import watchMem from "./modules/memwatch";
import Keyv from "keyv";
console.log(`Loading db's`);
console.time(`Loading db's`);
const db = new JSONdb("data/data.json");
const keyvSqlite = new KeyvSqlite("sqlite://data/main.db");
app.dbs = {};
app.kdbs = {};
// app.dbs.bday = new JSONdb("data/bday.json");
// im so sorry this db is going to fill up so fast as each entry is arround 116kb
// app.dbs.highseas = new JSONdb("data/highseas.json");
app.dbs.ddm = new JSONdb("data/discord-datamining.json");
app.dbs.memdebug = new JSONdb("data/memdb.json");
app.dbs.seven39 = new JSONdb("data/739.json");
app.dbs.flightly = new JSONdb("data/flightly.json");
app.dbs.journey = new JSONdb("data/journey.json");
app.dbs.anondm = new EncryptedJsonDb("data/anondm.json", {
  password: process.env.ANONDM_PASSWORD,
});
// easy migration for just this db.
app.dbs.mykcd = new JSONdb("data/mykcd.json");
app.dbs.tags = new JSONdb("data/tags.json");
app.dbs.stickymessages = new JSONdb("data/stickymessages.json");
app.dbs.thething = new JSONdb("data/the-thing-hc.json");
app.kdbs.yswsdb = new Keyv({ store: keyvSqlite, namespace: "yswsdb" });
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
  PrivateDNS(app, process.env.MY_NEXTDNS, `C07LT7XS28Z`);
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
