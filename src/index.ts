console.time("Startup");
console.time("Dotenv");
import "dotenv/config";
console.timeEnd("Dotenv");

console.time("Essential Imports");
import path from "path";
import JSONdb from "simple-json-db";
import { EncryptedJsonDb } from "./modules/encrypted-db";
import { LogSnag } from "@logsnag/node";
import * as utils from "./modules/index";
import Loader from "./modules/CommandLoader";
import { attachDB } from "./modules/projectWaterydo";
import { setupOverallCron } from "./modules/cron";
import watchMem from "./modules/memwatch";
import monitorMemCpu from "./modules/alertcpu";
import { watchForWhenIUseHacktime } from "./modules/hacktime";
import { resetSpotifyCache } from "./modules/howWasYourDay";
import initGitWatcher from "./modules/watch-git";
console.timeEnd("Essential Imports");

console.time("App Boot");
(async () => {
  const { default: app } = await import("./modules/slackapp");

  console.time("DB Load");
  const db = new JSONdb("data/data.json");
  app.db = db;
  app.dbs = {
    ddm: new JSONdb("data/discord-datamining.json"),
    channelhoisterdb: new JSONdb("data/channel-hoister.json"),
    memdebug: new JSONdb("data/memdb.json"),
    flightly: new JSONdb("data/flightly.json"),
    journey: new JSONdb("data/journey.json"),
    anondm: new EncryptedJsonDb("data/anondm.json", {
      password: process.env.ANONDM_PASSWORD,
    }),
    mykcd: new JSONdb("data/mykcd.json"),
    tags: new JSONdb("data/tags.json"),
    stickymessages: new JSONdb("data/stickymessages.json"),
  };
  app.kdbs = {};
  console.timeEnd("DB Load");

  app.utils = utils;
  attachDB(db);
  watchMem(app);

  app.logsnag = new LogSnag({
    token: process.env.LOGSNAG_TOKEN!,
    project: "slack-zeon",
  });

  await app.start(process.env.PORT || 3000);

  console.log("✅ App is UP");

  // ⏱️ Deferred Init
  Promise.all([
    import("@sentry/node").then((mod) => {
      app.sentry = mod;
      console.log("Sentry loaded");
    }),
    import("nocodb-sdk").then(({ Api }) => {
      app.nocodb = new Api({
        baseURL: process.env.NOCODB_URL!,
        headers: {
          "xc-token": process.env.NOCODB_TOKEN!,
        },
      });
      console.log("NocoDB API ready");
    }),
  ]).catch((err) => console.error("Deferred module error:", err));

  setupOverallCron(app);
  monitorMemCpu(app);
  resetSpotifyCache(app);
  watchForWhenIUseHacktime(app);

  app.client.chat.postMessage({
    channel: `C07LEEB50KD`,
    text: `Im up and running :3`,
  });

  initGitWatcher(app);

  const cmdLoader = new Loader(app, path.join(__dirname, "commands"));
  cmdLoader.runQuery();

  setInterval(() => {
    fetch("https://uptime.saahild.com/api/push/DioNHIGz58?status=up&msg=OK")
      .catch(() => setTimeout(() => {}, 5000));
  }, 60_000);

  app.client.chat.postMessage({
    channel: `D07LBMXD9FF`,
    text: `Starting Slack Bot :D`,
  });

  process.on("SIGINT", async () => {
    try {
      await app.client.chat.postMessage({
        channel: `C07LEEB50KD`,
        text: `I was up for \`${process.uptime()}\` seconds :3 its now time for my leave`,
      });
    } catch {
      console.error("Slack failed on shutdown");
    } finally {
      process.exit(0);
    }
  });

  process.on("unhandledRejection", handleError);
  process.on("uncaughtException", handleError);

  async function handleError(e: any) {
    console.error(e);
    try {
      if (!app.sentry) {
        const sentry = await import("@sentry/node");
        sentry.init({ dsn: process.env.SENTRY_DSN });
        app.sentry = sentry;
      }
      app.sentry.captureException(e);
    } catch {
      console.error("rip sentry (died while tryna report an error)");
    }

    try {
      app.client.chat.postMessage({
        channel: `D07LBMXD9FF`,
        text: `**Error:**\n\`\`\`${e.stack}\`\`\``,
      });
    } catch {}
  }
})();
console.timeEnd("App Boot");
console.timeEnd("Startup");
