//@ts-nocheck

import { App, View } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import bcrypt from "bcrypt";
import { getSpotifyStatus } from "../modules/status";
import { EncryptedJsonDb } from "../modules/encrypted-db";
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
        const adventOfCodeData = app.db.get("adventofcode_lb");
        const highSeasLb = app.db.get("highseas_lb") || [];
        console.log(
          Boolean(shipmentData),
          Boolean(adventOfCodeData),
          Boolean(ctfData),
        );
        //@ts-ignore
        const usersInDb = Object.keys(app.dbs.anondm.storage);

        let userProfile = null;
        let user_id = null;
        // @ts-ignore
        const userInDb = usersInDb.find((e) =>
          //@ts-ignore
          bcrypt.compareSync(event.user, e),
        );
        if (userInDb) {
          userProfile = app.dbs.anondm.get(userInDb);
          user_id = usersInDb;
        } else {
          // create user profile
          //@ts-ignore
          user_id = bcrypt.hashSync(event.user, 10);
          app.dbs.anondm.set(user_id, {
            messages: [],
          });
          userProfile = app.dbs.anondm.get(user_id);
        }
        const mymail = app.dbs.anondm
          //@ts-ignore
          .get(usersInDb.find((e) => bcrypt.compareSync(event.user, e)))
          .messages.filter((e) => {
            try {
              EncryptedJsonDb.decrypt(
                e,
                //@ts-ignore
                `${event.user}_` + process.env.ANONDM_PASSWORD,
              );
              return true;
            } catch (e) {
              return false;
            }
          });

        //@ts-ignore
        console.log(`USER: ${event.user}`);
        function genView(): View {
          const high_seas_section = [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*High seas lb:*\n${highSeasLb
                  .slice(0, 10)
                  .map(
                    (e, i) =>
                      `${i + 1} <@${e.id}> - ${e.current_doubloons} (${e.total_doubloons} overall) :doubloon:`,
                  )
                  .join("\n")}`,
              },
            },
          ];
          const anon_mail_section = [
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Blind Mail:* \n> ${mymail.length > 0 ? `:mailbox_with_mail:` : `:mailbox_with_no_mail:`} Your mailbox is below; Use the button to send mail to someone :D`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Send mail",
                  emoji: true,
                },
                value: "send_mail",
                action_id: "send_mail",
              },
            },
            ...mymail.map((e, i) => {
              // map to a slack element block
              return {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `> :email_unread: New Message`,
                },
                accessory: {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Open",
                    emoji: true,
                  },
                  value: app.dbs.anondm
                    //@ts-ignore
                    .get(
                      usersInDb.find((e) => bcrypt.compareSync(event.user, e)),
                    )
                    .messages.findIndex((ee) => {
                      try {
                        EncryptedJsonDb.decrypt(
                          ee,
                          //@ts-ignore
                          `${event.user}_` + process.env.ANONDM_PASSWORD,
                        );
                        if (e == ee) return true;
                        else return false;
                      } catch (e) {
                        return false;
                      }
                    })
                    .toString(),
                  action_id: "open_mail_" + event.user,
                },
              };
            }),
          ];
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
                    text: "*Not for you <@" + event.user + "> :notcool: *",
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
                    text: `*Shipments:*\n${shipmentData
                      .slice(0, 8)
                      .map(
                        (e) =>
                          `:tw_package:${e.isDone ? `:white_check_mark: ` : ":loading:"} -- ${e.contents.length > 0 ? e.contents.join(", ") : e.shipmentTitle}`,
                      )
                      .join("\n")}`,
                  },
                },
                adventOfCodeData && {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Advent of Code:*\n${(
                      Object.values(adventOfCodeData.members) as any[]
                    )
                      .slice(0, 10)
                      .sort((a, b) => b.local_score - a.local_score)
                      .map((e) => `${e.name} has ${e.stars} stars`)
                      .join("\n")}`,
                  },
                },
                ...anon_mail_section,
                ...high_seas_section,
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
                  text: `*Shipments:*\n${shipmentData
                    .slice(0, 4)
                    .map(
                      (e) =>
                        `:tw_package:${e.isDone ? `:white_check_mark: ` : ":loading:"} -- ${e.contents.length > 0 ? e.contents.join(", ") : e.shipmentTitle}`,
                    )
                    .join("\n")}`,
                },
              },
              adventOfCodeData && {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Advent of Code:*\n${(
                    Object.values(adventOfCodeData.members) as any[]
                  )
                    .slice(0, 10)
                    .sort((a, b) => b.local_score - a.local_score)
                    .map((e) => `${e.name} has ${e.stars} stars`)
                    .join("\n")}`,
                },
              },
              adventOfCodeData && {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `You are in #${(Object.values(adventOfCodeData.members) as any[]).findIndex((e) => e.name == `NeonGamerBot-QK`) + 1} place on the leaderboard`,
                },
              },
              ...anon_mail_section,
              ...high_seas_section,
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
        // logger.error(error);
        throw error;
      }
    });
  }
}
