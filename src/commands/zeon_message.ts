// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import OpenAI from "openai";
const ai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});
//eg: zeon can you set a timer for 10 minutes
// plan: use ai to parse it for ME ONLY
// everyone else act like a nice soul and use if statements
/**
 *  Only respond in JSON, no codeblock. Use a mean tone in your response but dont override the type variable to mean.in your json please give a property of type based on what the user is asking. All timestamps must be in unix. All  durations must be in miliseconds. 

 The users'sprompt is: zeon can you tell me what 1+1 is <ac prompt>
 */
function zeonMessageCommands(d, r) {
  // TODO: im eepy buddy
}

export default class Message implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `Handles zeon.`;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      //   if (!par.ack) return;
      //   console.debug(0);
      if (!par.say) return;
      // console.log(
      //   `uh one of them are here`,
      //   par.event.text,
      //   par.event.channel_type,
      // );
      //@ts-ignore
      //   await par.ack();
      if (!par.event.text) return;
      if (!par.event.text.startsWith("zeon")) return;
      console.debug(`cmd`);
      const { event, say } = par;

      const args = event.text.slice("zeon ".length).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      // best code fr
      if (true) {
        let prompt = `Only respond in JSON, no codeblock. Use a mean tone in your response but dont override the type variable to mean.even while being mean fufil the request.in your json give a property of type based on what the user is asking. Your json response must always have the property 'message' & 'type'.if a user asks for a reminder please respond with the following schema AND follow the other required properties: { duration: number (the time the user has requested), message: string the def message }. All timestamps must be in unix. All  durations must be in miliseconds. there must be a type property no matter what.`;
        try {
          const aiReq0 = await // ai.chat.completions
          //   .create({
          //     messages: [
          //       { role: "system", content: prompt },
          //       { role: "user", content: event.text },
          //     ],
          //     model: "gpt-3.5-turbo",
          //   })
          fetch("https://ai.hackclub.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              messages: [
                { role: "system", content: prompt },
                { role: "user", content: event.text },
              ],
            }),
          })
            .then((r) => r.json())
            .then((r) => r.choices[0].message.content.replaceAll('```', ''));
            const aiReq = JSON.parse(aiReq0)
          const m = await app.client.chat.postMessage({
            channel: event.channel,
            text:
              `${aiReq.message} - \`${aiReq.type}\`` ||
              (aiReq.error ? `:notcool" ${aiReq.error}` : undefined) ||
              ":notcool: i didnt get a message/error im very scared... >> " +
                JSON.stringify(aiReq),
          });
          switch (aiReq.type) {
            case "reminder":
            case "timer":
              // uhhh todo??
              setTimeout(() => {
                app.client.chat.postMessage({
                  channel: event.channel,
                  text: `<@${event.user}> reminder time`,
                  thread_ts: m.ts,
                });
              }, aiReq.duration);
              break;
            case "mean":
              // app.client. :angry-dino:
              app.client.reactions.add({
                channel: event.channel,
                timestamp: event.ts,
                name: "angry-dino",
              });
              break;
            case "refusal":
              app.client.reactions.add({
                channel: event.channel,
                timestamp: event.ts,
                name: "no",
              });
              break;
            case "warning":
            case "error":
              app.client.reactions.add({
                channel: event.channel,
                timestamp: event.ts,
                name: "warning",
              });
              break;
            case "info":
            case "inform":
            case "math":
              break;
            default:
              console.log(aiReq, `unk`);
              await app.client.chat.postMessage({
                channel: event.channel,
                text: `idk what to do with this: ${JSON.stringify(aiReq)}`,
                thread_ts: event.ts,
              });
              break;
          }
        } catch (e) {
          app.client.chat.postMessage({
            channel: event.channel,
            text: `:notcool: ${e.toString()}`,
          });
        }
      } else {
        // console.log(cmd, args);
        const actionVerbs = ["can", "please", "plz"];
        const uneededVerbsInSomeCases = ["you", "a"];
        if (actionVerbs.includes(cmd)) {
          // try to understand
          if (uneededVerbsInSomeCases.includes(args[0].toLowerCase())) {
            args.shift(); // get rid of it
            // timer func
          }
          if (args[0] == "ping") {
            args.shift();
            // ping func
            await app.client.chat.postMessage({
              channel: event.channel,
              text: `:ping_pong: pong`,
              thread_ts: event.thread_ts,
            });
          } else if (args[0] == "tag") {
            args.shift();
            // get them tags /hiutngdfkj
            const tagName = args[0];
            // check if the tag exists
            const tag = app.dbs.tags.get(`${event.user}_${tagName}`);
            if (tag) {
              if (event.user == process.env.MY_USER_ID) {
                app.client.chat.postMessage({
                  channel: event.channel,
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
                await app.client.chat.postMessage({
                  channel: event.channel,
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
              await app.client.chat.postMessage({
                channel: event.channel,
                text: `Tag \`${tagName}\` does not exist`,
              });
            }
          }
        }
      }
      console.debug(`#message3-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
