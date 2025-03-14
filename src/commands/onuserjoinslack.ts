//@ts-nocheck
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { banned_users } from "./joinchannel";
import { ModifiedApp } from "../modules/slackapp";

export default class UserJoinSlackEvent implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `team_join`;
    this.description = `User joins slack `;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.event(this.name, async ({ event, say, body }) => {
      console.debug(event, "#userjoinslack");
      //@ts-ignore
      app.client.chat.postMessage({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${event.user.name} (${event.user.real_name}) (<@${event.user.id}>) just joined the slack!`,
            },
            accessory: {
              type: "image",
              image_url:
                event.user.profile.image_192 || event.user.profile.image_48,
              alt_text: "Avatar of " + event.user.name,
            },
          },
          // {
          //   type: "divider",
          // },
          // {
          //   type: "actions",
          //   elements: [
          //     {
          //       type: "button",
          //       text: {
          //         type: "plain_text",
          //         text: "Steam User Link",
          //         emoji: true,
          //       },
          //       value: "steam_user_link",
          //       url: player.profileurl,
          //     },
          //   ],
          // },
        ],
        channel: "C08HTF94XV2",
      });
    });
  }
}
