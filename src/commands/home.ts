//

import { App, View } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
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
  run(app: App) {
    // app.command()
    app.event(this.name, async ({ event, client, logger }) => {
        try {
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
