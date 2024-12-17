//Global tags for everyone
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
export const tagstore = {
  // ONLY STATIC ONES, may use blocks
  testing: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "testing",
      },
    },
  ],
  no_adventofcode_highseas: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*No adventofcode for high seas*\n\n<https://hackclub.slack.com/archives/C08354Z3Z0A/p1733072766049389|See here for more info>",
      },
    },
  ],
};
export default class TagSystem implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/tag`;
    this.description = `Tag system`;
  }
  run(app: ModifiedApp) {
    // app.command()
    //@ts-ignore
    app.command(this.name, async (par) => {
      const stamp = Date.now();
      const { command, ack, respond } = par;
      await ack();

      // respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
      //   console.debug(`after ping`, d);
      // });
      const args = command.text.split(" ");
      const cmd = args.shift();
      if (!cmd)
        return respond({
          response_type: "ephemeral",
          text: `Please provide a command`,
        });

      // usage: /tag use <tag>
      // user based tag store
      if (cmd == "use") {
        const tagName = args[0];
        // check if the tag exists
        const tag = app.dbs.tags.get(`${command.user_id}_${tagName}`);
        if (tag) {
          if (command.user_id == process.env.MY_USER_ID) {
            app.client.chat.postMessage({
              channel: command.channel_id,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: tag,
                  },
                },
                {
                  // context block
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: `Tag: ${tagName}`,
                    },
                  ],
                },
              ],
              token: process.env.MY_SLACK_TOKEN,
            });
          } else {
            await respond({
              response_type: "in_channel",
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: tag,
                  },
                },
                {
                  // context block
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: `Tag: ${tagName} - sent by <@${command.user_id}>`,
                    },
                  ],
                },
              ],
            });
          }
        } else {
          await respond({
            text: `Tag \`${tagName}\` does not exist`,
          });
        }
      } else if (cmd == "static") {
        const tagName = args[0];
        // check if the tag exists
        const tag = tagstore[tagName];
        if (tag) {
          if (command.user_id == process.env.MY_USER_ID) {
            app.client.chat.postMessage({
              channel: command.channel_id,
              blocks: [
                ...tag,
                {
                  // context block
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: `Tag: ${tagName}`,
                    },
                  ],
                },
              ],
              token: process.env.MY_SLACK_TOKEN,
            });
          } else {
            await respond({
              response_type: "in_channel",
              blocks: [
                ...tag,
                {
                  // context block
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: `Tag: ${tagName} - sent by <@${command.user_id}>`,
                    },
                  ],
                },
              ],
            });
          }
        } else {
          await respond({
            text: `Static Tag \`${tagName}\` does not exist`,
          });
        }
      } else if (cmd == "help") {
        respond({
          response_type: "ephemeral",
          text: `Zeon Tag System Help\n\n/tag use <tag>\n/tag add\n/tag rm <tag>`,
        });
      } else if (cmd == "list") {
        const tags = Object.keys(app.dbs.tags.JSON())
          .filter((e) => e.startsWith(command.user_id))
          .map((e) => {
            return {
              name: e.split("_").slice(1).join("_"),
              value: app.dbs.tags.get(e),
            };
          });
        await respond({
          response_type: "ephemeral",
          text: `Tags:\n${tags.map((e, i) => `${i + 1}. ${e.name}`).join("\n")}`,
        });
      } else if (cmd == "rm") {
        const tagName = args[0];
        // check if the tag exists
        const tag = app.dbs.tags.get(`${command.user_id}_${tagName}`);
        if (tag) {
          app.dbs.tags.delete(`${command.user_id}_${tagName}`);
          respond({
            response_type: "ephemeral",
            text: `Tag ${tagName} removed`,
          });
        } else {
          respond({
            response_type: "ephemeral",
            text: `Tag \`${tagName}\` does not exist`,
          });
        }
      } else if (cmd === "add") {
        // open a modal
        await app.client.views.open({
          trigger_id: command.trigger_id,
          view: {
            type: "modal",
            callback_id: "view_modal_tag",
            title: {
              type: "plain_text",
              text: "Add a tag",
              emoji: true,
            },
            submit: {
              type: "plain_text",
              text: "Submit",
            },
            close: {
              type: "plain_text",
              text: "Cancel",
            },
            blocks: [
              {
                type: "input",
                block_id: "tag_input",
                label: {
                  type: "plain_text",
                  text: "Tag name",
                },
                element: {
                  type: "plain_text_input",
                  action_id: "tag_input",
                },
              },
              {
                type: "input",
                block_id: "tag_output",
                label: {
                  type: "plain_text",
                  text: "Tag output",
                },
                element: {
                  type: "plain_text_input",
                  action_id: "tag_input",
                },
              },
            ],
          },
        });
      }
    });
    app.view(
      "view_modal_tag",
      async ({ ack, body, view, context, respond }) => {
        await ack({
          response_action: "clear",
        });
        console.log(0);
        const tag = body.view.state.values.tag_input.tag_input.value;
        console.log(1, body.view.state.values);
        // @ts-ignore
        const name = body.view.state.values.tag_output.tag_input.value;
        console.log(2);
        console.log(tag, name);
        app.dbs.tags.set(`${body.user.id}_${name}`, tag);
        // save it
        // app.dbs.tags.set(`${command.user_id}_${name}`, tag);
        respond({
          response_type: "ephemeral",
          text: `Tag \`${name}\` saved`,
        });
      },
    );
  }
}
