import { App, SlackAction } from "@slack/bolt";
import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
export default class AnonDM implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `anondmfuncs`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    app.action("send_mail", async (par) => {
      const { action, ack, respond } = par;
      await ack();
      console.debug(`#action`, par);
      const user = par.body.user;
      // display user model

      await app.client.views.open({
        //@ts-ignore
        trigger_id: par.body.trigger_id,
        view: {
          type: "modal",
          callback_id: "send_mail_form",
          blocks: [
            {
              type: "input",
              element: {
                type: "multi_users_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select users",
                  emoji: true,
                },
                action_id: "multi_users_select-action",
              },
              label: {
                type: "plain_text",
                text: "Who do you want to dm (>10 people)",
                emoji: true,
              },
            },
            {
              type: "input",
              element: {
                type: "plain_text_input",
                multiline: true,
                action_id: "plain_text_input-action",
              },
              label: {
                type: "plain_text",
                text: "Your message",
                emoji: true,
              },
            },
            {
              type: "divider",
            },
            {
              type: "context",
              elements: [
                {
                  type: "plain_text",
                  text: "You may only send a letter if they have opened your other letter already",
                  emoji: true,
                },
              ],
            },
          ],
          title: {
            type: "plain_text",
            text: "Send Mail",
          },
          submit: {
            type: "plain_text",
            text: "Mail!",
          },
          close: {
            type: "plain_text",
            text: "Cancel",
          },
        },
      });
    });
    app.view("send_mail_form", async (par) => {
      const { ack, respond } = par;
      await ack();
      console.debug(`#view`, par.body.view.blocks, par.payload);
      // get modal data from inputs
      const users = par.body.view.state;
      console.log(users);
      const user = par.body.user;
      // display user model
      await app.client.chat.postMessage({
        channel: user.id,
        text: `You have sent a mail to ${user.name} (test)`,
      });
    });
  }
}
