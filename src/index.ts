import "dotenv/config";
import "./modules/watch-git";
// import "./modules/smee"
import app from "./modules/slackapp";
import { View } from "@slack/bolt";
import Loader from "./modules/CommandLoader";
import path from "path";
app.start(process.env.PORT || 3000).then((d) => {
  console.log(`App is UP (please help)`);
});
// app.client.cha
const cmdLoader = new Loader(app, path.join(__dirname, "commands"));
// this is temp i swear
cmdLoader.runQuery();

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
              text: "Uptime: {uptime}",
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
