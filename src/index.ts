import "dotenv/config";
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
const db = new JSONdb("data.json");
app.start(process.env.PORT || 3000).then(async (d) => {
  console.log(`App is UP (please help)`);
  setInterval(() => {
    fetch(
      "https://uptime.saahild.com/api/push/DioNHIGz58?status=up&msg=OK&ping=",
    );
  }, 60_000);
  app.client.chat.postMessage({
    channel: `D07LBMXD9FF`,
    text: `Starting Slack Bot :D`,
  });
  init(app);
});
// app.client.cha
const cmdLoader = new Loader(app, path.join(__dirname, "commands"));
// this is temp i swear
cmdLoader.runQuery();
function formatUptime(uptime: number = process.uptime()) {
  const seconds = Math.floor(uptime % 60);
  const minutes = Math.floor((uptime / 60) % 60);
  const hours = Math.floor((uptime / (60 * 60)) % 24);
  const days = Math.floor(uptime / (60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Listen for users opening your App Home
//@see https://api.slack.com/tools/block-kit-builder
app.event("app_home_opened", async ({ event, client, logger }) => {
  try {
    console.log(`USER: ${event.user}`);
    function genView(): View {
      if (process.env.MY_USER_ID !== event.user)
        return {
          // Home tabs must be enabled in your app configuration page under "App Home"
          type: "home",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Not for you <@" + event.user + "> :x: *",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Nothing on the home page for you :P.",
              },
            },
          ],
        };
      return {
        type: "home",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Main",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Zeons Home page",
            },
          },
          {
            type: "divider",
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Stats",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Uptime: `{uptime}`".replace("{uptime}", formatUptime()),
            },
          },
          {
            type: "divider",
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Zeon Links",
              emoji: true,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "My Site",
                  emoji: true,
                },
                value: "my_site_link",
                url: "https://saahild.com/zeon",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "My code",
                  emoji: true,
                },
                value: "my_source_link",
                url: "https://github.com/NeonGamerBot-QK/slack-zeon",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "My panel",
                  emoji: true,
                },
                value: "my_panel_url",
                url: "https://gp.saahild.com/server/cd4830c1",
              },
            ],
          },
          {
            type: "divider",
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Zeon - Danger Zone",
              emoji: true,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Restart",
                  emoji: true,
                },
                style: "danger",
                value: "restart-instance",
              },
            ],
          },
        ],
      };
    }
    // Call views.publish with the built-in client
    const result = await client.views.publish({
      // Use the user ID associated with the event
      user_id: event.user,
      view: genView(),
    });

    // logger.info(result);
  } catch (error) {
    logger.error(error);
  }
});
function handleError(e: any) {
  console.error(e);
  try {
    app.client.chat.postMessage({
      channel: `D07LBMXD9FF`,
      text: `**Error:**\n\`\`\`${e.stack}\`\`\``,
    });
  } catch (e) {}
}
function updateStatus(emoji: string, str: string, clearStats?: boolean) {
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
}
cron.schedule("* * * * *", async () => {
  //TODO: Add custom PFP's for music (cuz headphones would be nice)
  const jellyfinStr = await getJellyfinStatus();
  const spotifyStr = await getSpotifyStatus();
  if (jellyfinStr) {
    updateStatus(":jellyfin:", jellyfinStr);
  } else if (spotifyStr) {
    updateStatus(":new_spotify:", spotifyStr);
  } else {
    // clear status
    updateStatus(
      ":trash:",
      "Zeons cleaning up neons status.. ignore this",
      true,
    );
  }
  //TODO ADD MORE RPC
  // at home? at school?
  // set away if in any focus mode
});
async function sendRandomStuff() {
  app.client.chat.postMessage({
    channel: "C07R8DYAZMM",
    //@ts-ignore
    text: await getResponse(db),
  });
}
//TODO: add more random times
cron.schedule("5 */12 * * *", sendRandomStuff);
cron.schedule("25 */22 * * *", sendRandomStuff);
cron.schedule("15 */3 * * *", sendRandomStuff);
cron.schedule("45 2 */2 * *", sendRandomStuff);
cron.schedule("1 7 * * 1-5", async () => {
  app.client.chat.postMessage({
    channel: "C07R8DYAZMM",
    //@ts-ignore
    text: `Good Morning :D! Wake up <@${process.env.MY_USER_ID}> your ass needs to get ready for school now!.\n> todo add hw due today here`,
  });
});
cron.schedule("1 9 * * 6-7", () => {
  const isSaturday = new Date().getDay() === 6;
  app.client.chat.postMessage({
    channel: "C07R8DYAZMM",
    //@ts-ignore
    text: `Good Morning :D! dont wake up since i bet ur ass only went to sleep like 4 hours ago :P.${isSaturday ? "\n> You should be at robotics tho..." : ""}`,
  });
});
process.on("unhandledRejection", handleError);
process.on("unhandledException", handleError);
