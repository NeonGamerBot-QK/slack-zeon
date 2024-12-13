//Global tags for everyone
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
export const tagstore = {
// ONLY STATIC ONES, may use blocks
  "testing": [{
    type: "section",
    text: {
      type: "mrkdwn",
      text: "testing",
    }
  }]
}
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
        return    respond({
          response_type: 'ephemeral',
          text: `Please provide a command`,
        });
      
      // usage: /tag use <tag>
      // user based tag store
      if (cmd == "use") {
        const tagName = args[0];
        // check if the tag exists
        const tag = app.dbs.tags.get(`${command.user_id}_${tagName}`);
        if(tag) {
        await respond({
          token: command.user_id == process.env.MY_USER_ID ? process.env.MY_SLACK_TOKEN : undefined,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: tag
              }
            },
            {
              // context block
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Tag ${tagName}`,
                }
              ]
            }
          ]
        })
        } else {
          await respond({
            text: `Tag \`${tagName}\` does not exist`,
          });
        }
      } else if(cmd == "static") {
        const tagName = args[0];
        // check if the tag exists
        const tag = tagstore[tagName];
        if(tag) {
          await respond({
            token: command.user_id == process.env.MY_USER_ID ? process.env.MY_SLACK_TOKEN : undefined,
            blocks: [...tag, {
              // context block
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Tag ${tagName}`,
                }
              ]
            } ] 
          })
        }
      } 
      else if(cmd == "help") {
       respond({
          response_type: 'ephemeral',
          text: `Zeon Tag System Help\n\n/tag use <tag>\n/tag add\n/tag rm <tag>`,
        });
      } else if(cmd == "list") {
        const tags = Object.keys(app.dbs.tags.JSON()).filter(e=>e.startsWith(command.user_id)).map(e=> {
          return {
            name: e.split("_").slice(1).join("_"),
            value: app.dbs.tags.get(e),
          }
        });
        await respond({
          response_type: "ephemeral",
          text:  `Tags:\n${tags.map((e,i)=>`${i+1}. ${e.name}`).join("\n")}`,
        })
      }
       else if(cmd == "rm") {
        const tagName = args[0];
        // check if the tag exists
        const tag = app.dbs.tags.get(`${command.user_id}_${tagName}`);
        if(tag) {
          app.dbs.tags.delete(`${command.user_id}_${tagName}`);
          respond({
            response_type: 'ephemeral',
            text: `Tag ${tagName} removed`,
          });
        } else {
          respond({
            response_type: 'ephemeral',
            text: `Tag \`${tagName}\` does not exist`,
          });
        }
      }
    });
    app.view("view_modal_tag", async ({ ack, body, view, context }) => {
      // TODO: make it grab the input/new input
      // submit and save for the user's tag
    });
  }
}
