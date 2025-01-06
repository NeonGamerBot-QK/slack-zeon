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

import * as utils from "./modules/index";
import howWasYourDay, {
  cached_spotify_songs,
  resetSpotifyCache,
} from "./modules/howWasYourDay";
import { PrivateDNS } from "./modules/nextdns";
import { attachDB } from "./modules/projectWaterydo";

import { watchForWhenIUseHacktime } from "./modules/hacktime";

import { EncryptedJsonDb } from "./modules/encrypted-db";
import { setupOverallCron } from "./modules/cron";
import watchMem from "./modules/memwatch";

const db = new JSONdb("data/data.json");
app.dbs = {};
app.dbs.bday = new JSONdb("data/bday.json");
app.dbs.ddm = new JSONdb("data/discord-datamining.json");
app.dbs.memdebug = new JSONdb("data/memdb.json");
app.dbs.anondm = new EncryptedJsonDb("data/anondm.json", {
  password: process.env.ANONDM_PASSWORD,
});
app.dbs.tags = new JSONdb("data/tags.json");
app.dbs.stickymessages = new JSONdb("data/stickymessages.json");
attachDB(db);
watchMem(app);
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
setupOverallCron(app);
process.on("unhandledRejection", handleError);
process.on("unhandledException", handleError);
