//

import { App, View } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import { getSpotifyStatus } from "../modules/status";
function formatUptime(uptime: number = process.uptime()) {
  const seconds = Math.floor(uptime % 60);
  const minutes = Math.floor((uptime / 60) % 60);
  const hours = Math.floor((uptime / (60 * 60)) % 24);
  const days = Math.floor(uptime / (60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
export default class AppHome implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `app_home_opened`;
    this.description = `app home`;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.event(this.name, async ({ event, client, logger }) => {
      try {
        const spotifyStr = await getSpotifyStatus();
        //@ts-ignore
        const shipmentData = app.db.get(`shipments_${event.user}`);
        const ctfData = app.db.get("ctf") || [];
        //@ts-ignore
        console.log(`USER: ${event.user}`);
        function genView(): View {
          //@ts-ignore
          if (process.env.MY_USER_ID !== event.user)
            return {
              // Home tabs must be enabled in your app configuration page under "App Home"
              type: "home",
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    //@ts-ignore
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
                // ctf channels (the user can see it)
                ctfData.length > 0 && {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Ctf channels:*\n${ctfData.map((e) => `<#${e.channel}>`).join("\n")}`,
                  },
                },
                shipmentData && {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Shipments:*\n${shipmentData.map((e) => `:tw_package:${e.isDone ? `:white_check_mark: ` : ":loading:"} -- ${e.contents.join(", ")}`).join("\n")}`,
                  },
                },
              ].filter(Boolean),
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
                  text: "Uptime: `{uptime}`".replace(
                    "{uptime}",
                    formatUptime(),
                  ),
                },
              },
              // ctf channels (the user can see it)
              ctfData.length > 0 && {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Ctf channels:*\n${ctfData.map((e) => `<#${e.channel}>`).join("\n")}`,
                },
              },
              shipmentData && {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Shipments:*\n${shipmentData.map((e) => `:tw_package:${e.isDone ? `:white_check_mark: ` : ":loading:"} -- ${e.contents.join(", ")}`).join("\n")}`,
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
              spotifyStr && {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Spotify:*\n${spotifyStr}`,
                },
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
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Force Start the nextdns instances again (will not kill previous ones)",
                      emoji: true,
                    },
                    style: "danger",
                    value: "start-nextdns-instance",
                  },
                ],
              },
            ].filter(Boolean),
          };
        }
        // Call views.publish with the built-in client
        const result = await client.views.publish({
          // Use the user ID associated with the event
          //@ts-ignore
          user_id: event.user,
          view: genView(),
        });

        // logger.info(result);
      } catch (error) {
        logger.error(error);
      }
    });
  }
}
