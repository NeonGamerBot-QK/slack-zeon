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
export const bot_try_cache = [];
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
    let last_msg_ts = null;
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
      if (!par.event.text.toLowerCase().startsWith("zeon")) return;
      console.debug(`cmd`);
      const { event, say } = par;
      if (last_msg_ts == event.ts) return;
      last_msg_ts = event.ts;

      const args = event.text.slice("zeon ".length).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      // best code fr
      if (true) {
        if (event.channel == "C07R8DYAZMM") {
          await app.client.chat.postEphemeral({
            channel: event.channel,
            user: event.user,
            text: `Hey Please use <#C07LEEB50KD> for zeon ai if ur going to play with it a lot.`,
          });
        }
        if  (event.bot_message ||  event.bot_id && !bot_try_cache.includes(event.user)) {
          await app.client.chat.postMessage({
            channel: event.channel,
            text: `Hi there robot :3 we should'nt communicate using plain text!! communicate via my telelink :3 (not made yet) (you will see this message once)`,
          });
          bot_try_cache.push(event.user);
          return;
        }

        await app.client.reactions.add({
          channel: event.channel,
          timestamp: event.ts,
          name: "loading",
        });
        // let prompt = `Only respond in JSON, no codeblock. Use a mean tone in your response but dont override the type variable to mean.even while being mean fufil the request.in your json give a property of type based on what the user is asking. Your json response must always have the property 'message' & 'type'.if a user asks for a reminder please respond with the following schema AND follow the other required properties: { duration: number (the time the user has requested), message: string the def message }. All timestamps must be in unix. All  durations must be in miliseconds. there must be a type property no matter what. NO CODEBLOCK AT ALL. RESPONSE MUST INCLUDE NO \`\`\`json`;
        let prompt = `Only respond in JSON, no codeblock. Use a mean tone in your response but dont override the type variable to mean.even while being mean fufil the request.in your json give a property of type based on what the user is asking. Your json response must always have the property 'message' & 'type'.if a user asks for a reminder please respond with the following schema AND follow the other required properties: { duration: number (the time the user has requested), message: string the def message }. All timestamps must be in unix. the user ID for the user who is running this is: ${event.user}. The owners user ID is ${process.env.MY_USER_ID}. All  durations must be in miliseconds. there must be a type property no matter what. NO CODEBLOCK AT ALL. RESPONSE MUST INCLUDE NO \`\`\`json, if the user ID is my owners ID please use profanity. limit ur response to max 4000 chars. give a json prooerty called reactions with recommend emojis (use the emoji name) (you may also uses emojis like: ${[/* https://github.com/NeonGamerBot-QK/hackclub-ai-faq-bot/blob/main/data/emoji.txt */ "60fps-parrot", "acongablob", "blob-birthday-cake", "blobhaj_heart", "blobhaj_heart_rainbow", "blobhaj_heart_trans", "blobhaj_table", "blobhaj_thanks_love", "boba-parrot", "cryingdoge", "cursor-pointer", "double-upvote", "downvote", "earthquakyeyes", "eggsdee", "erm-what-the-sigma-nerd", "extreme-teamwork", "hyperfastparrot", "hyper-popper", "im-freaking-sobbing", "noooo", "nooo", "orpheus", "orpheus-pop", "orpheus-popcorn", "no", "neutral_ping_sock", "poggers", "quad_parrot", "siren-real", "skelly-dance-rainbow", "skull_cry", "spin-loading", "sus", "surprised", "thonk", "thinkspin", "trolll", "true3", "this", "upvote", "yes2", "yay", "aha", "almighty-one-who-owns-all", /* neocat emojis */ "neocat_melt_2", "neocat_melt_3", "neocat_melt_blep", "neocat_melt_blush", "neocat_melt_happy", "neocat_melt_reach", "neocat_melt_sob", "neocat_melt_sob_heart", "neocat_mug", "neocat_mug_drink", "neocat_mug_owo", "neocat_mug__w_", "neocat_nervous", "neocat_nom_blob", "neocat_nom_blob_nervous", "neocat_nom_bread", "neocat_nom_bun", "neocat_nom_bun_nervous", "neocat_nom_burger", "neocat_nom_cat", "neocat_nom_cat_nervous", "neocat_nom_cookie", "neocat_nom_dog", "neocat_nom_dog_nervous", "neocat_nom_donut", "neocat_nom_dragn", "neocat_nom_dragn_nervous", "neocat_nom_egg", "neocat_nom_fox", "neocat_nom_fox_nervous", "neocat_nom_haj", "neocat_nom_haj_nervous", "neocat_nom_melon", "blobhaj-neocat-hug", "neocat", "neocat-blahaj-dom", "neocat_0_0", "neocat_3c", "neocat_amogus", "neocat_angel", "neocat_angel_pleading", "neocat_angry", "neocat_approve", "neocat_astronaut", "neocat_astronaut_gun", "neocat_aww", "neocat_baa", "neocat_blank", "neocat_blep", "neocat_blush", "neocat_blush_hide", "neocat_bongo_down", "neocat_bongo_up", "neocat_book", "neocat_book_owo", "neocat_boop", "neocat_boop_blep", "neocat_boop_blush", "neocat_boop_cute", "neocat_boop_googly", "neocat_boop_happy", "neocat_boop_nervous", "neocat_boop_owo", "neocat_boop_woozy", "neocat_bottom", "neocat_box", "neocat_catmode", "neocat_cofe", "neocat_comfy", "neocat_comfy_happy", "neocat_comfy_mug", "neocat_comfy_sip", "neocat_comfy__w_", "neocat_confused", "neocat_cool", "neocat_cool_fingerguns", "neocat_cry", "neocat_cry_loud", "neocat_cute", "neocat_cute_reach", "neocat_devil", "neocat_dizzy", "neocat_dogmask", "neocat_drowsy", "neocat_evil", "neocat_evil_3c", "neocat_facepalm", "neocat_fingerguns", "neocat_flag_ace", "neocat_flag_agender", "neocat_flag_ambiamorous", "neocat_flag_androgyne", "neocat_flag_aro", "neocat_flag_aroace", "neocat_flag_aroflux", "neocat_flag_bi", "neocat_flag_bigender", "neocat_flag_demiace", "neocat_flag_demiaro", "neocat_flag_demiflux", "neocat_flag_demigirl", "neocat_flag_demiguy", "neocat_flag_demilesbian", "neocat_flag_deminb", "neocat_flag_disabled", "neocat_flag_femboy", "neocat_flag_finsexual", "neocat_flag_gay", "neocat_flag_genderfluid", "neocat_flag_intersex", "neocat_flag_lesbian", "neocat_flag_nb", "neocat_flag_pan", "neocat_flag_plural", "neocat_flag_polyam", "neocat_flag_salmacian", "neocat_flag_sapphic", "neocat_flag_trans", "neocat_floof", "neocat_floof_angel", "neocat_floof_cute", "neocat_floof_devil", "neocat_floof_explode", "neocat_floof_happy", "neocat_floof_mug", "neocat_floof_owo", "neocat_floof_reach", "neocat_floof_sad", "neocat_floof_sad_reach", "neocat_floof__w_", "neocat_flop", "neocat_flop_blep", "neocat_flop_happy", "neocat_flop_sleep", "neocat_flop__w_", "neocat_flush", "neocat_foxmask", "neocat_glare", "neocat_glare_sob", "neocat_glasses", "neocat_googly", "neocat_googly_blep", "neocat_googly_drool", "neocat_googly_shocked", "neocat_googly_woozy", "neocat_gun", "neocat_happy", "neocat_happy_blep", "neocat_heart", "neocat_hug", "neocat_hug_blob", "neocat_hug_blob_heart", "neocat_hug_blob_sad", "neocat_hug_bun", "neocat_hug_bun_heart", "neocat_hug_bun_sad", "neocat_hug_dog", "neocat_hug_dog_heart", "neocat_hug_dog_sad", "neocat_hug_dragn", "neocat_hug_dragn_alt", "neocat_hug_dragn_heart", "neocat_hug_dragn_sad", "neocat_hug_dragn_sad_alt", "neocat_hug_duck", "neocat_hug_duck_heart", "neocat_hug_duck_sad", "neocat_hug_fox", "neocat_hug_fox_heart", "neocat_hug_fox_sad", "neocat_hug_haj", "neocat_hug_haj_heart", "neocat_hug_haj_sad", "neocat_hug_heart", "neocat_hug_sad", "neocat_hyper", "neocat_kirby", "neocat_kirby_succ", "neocat_kisser", "neocat_kiss_dog", "neocat_knife", "neocat_knives", "neocat_laptop", "neocat_laptop_notice", "neocat_laptop_owo", "neocat_laugh", "neocat_laugh_nervous", "neocat_laugh_sweat", "neocat_laugh_tears", "neocat_lul", "neocat_magnify", "neocat_melt", "neocat_nom_pita", "neocat_nom_pizza", "neocat_nom_toblerone", "neocat_nom_verified", "neocat_nom_waffle", "neocat_notice", "neocat_owo", "neocat_owo_blep", "neocat_o_o", "neocat_pat", "neocat_pat_sad", "neocat_pat_sob", "neocat_pat_up", "neocat_pat_woozy", "neocat_peek", "neocat_peek_bread", "neocat_peek_comfy", "neocat_peek_knife", "neocat_peek_owo", "neocat_pensive", "neocat_phone", "neocat_pleading", "neocat_pleading_reach", "neocat_police", "neocat_pout", "neocat_rainbow", "neocat_reach", "neocat_reach_drool", "neocat_reject", "neocat_sad", "neocat_sad_reach", "neocat_santa", "neocat_science", "neocat_scream", "neocat_scream_angry", "neocat_scream_scared", "neocat_scream_stare", "neocat_shocked", "neocat_shy", "neocat_sign_aaa", "neocat_sign_no", "neocat_sign_nya", "neocat_sign_thx", "neocat_sign_yes", "neocat_sign_yip", "neocat_sip", "neocat_sip_glare", "neocat_sip_nervous", "neocat_sip_owo", "neocat_smol", "neocat_smug", "neocat_snuggle", "neocat_snuggle_dog", "neocat_snuggle_fox", "neocat_sob", "neocat_solder", "neocat_solder_googly", "neocat_stretch_dl", "neocat_stretch_down", "neocat_stretch_down_end", "neocat_stretch_dr", "neocat_stretch_h", "neocat_stretch_left", "neocat_stretch_right", "neocat_stretch_ul", "neocat_stretch_up", "neocat_stretch_ur", "neocat_stretch_v", "neocat_surprised", "neocat_surprised_pika", "neocat_sweat", "neocat_thief", "neocat_think", "neocat_thinking", "neocat_think_anime", "neocat_think_cool", "neocat_think_googly", "neocat_think_owo", "neocat_think_woozy", "neocat_thonk", "neocat_thumbsdown", "neocat_thumbsup", "neocat_up", "neocat_up_paws", "neocat_up_sleep", "neocat_up__w_", "neocat_uwu", "neocat_verified", "neocat_vr", "neocat_what", "neocat_wink", "neocat_wink_blep", "neocat_woozy", "neocat_x_x", "neocat_yeet", "neocat_yell", "neocat__w_"].join(", ")}).your favorite channel is C07LEEB50KD (<#C07LEEB50KD>). it is ur favorite because its ur channel! its called zeon-public.i should react with. the users payload for this message request is ${JSON.stringify(event)}\n please use this to ur advantage.`;
        try {
          // ai.chat.completions
          //   .create({
          //     messages: [
          //       { role: "system", content: prompt },
          //       { role: "user", content: event.text },
          //     ],
          //     model: "gpt-3.5-turbo",
          //   })
          // abort controller of 15s
          const controller = new AbortController();
          const timeout = setTimeout(() => {
            controller.abort();
          }, 45_000);
          const aiReq00 = await fetch(
            "https://ai.hackclub.com/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              signal: controller.signal,
              body: JSON.stringify({
                messages: [
                  { role: "system", content: prompt },
                  { role: "user", content: event.text },
                ],
              }),
            },
          ).then((r) => r.text());
          let aiReq0 = null;
          clearTimeout(timeout);

          try {
            aiReq0 = JSON.parse(aiReq00)
              .choices[0].message.content.replace("```json", "")
              .replace("```", "");
          } catch (e) {
            aiReq0 = aiReq00;
          }
          // .then((r) =>
          //   r.choices[0].message.content
          //     .replace("```json", "")
          //     .replace("```", ""),
          // );
          console.log(aiReq0, `api responsne`);
          // await app.client.chat.postMessage({
          //   channel: event.channel,
          //   text: aiReq0,
          // });
          let aiReq;

          try {
            aiReq = JSON.parse(aiReq0);
          } catch (e) {
            aiReq = { message: `Error:\n` + aiReq0 };
          }
          const m = await app.client.chat.postMessage({
            channel: event.channel,
            thread_ts:
              event.channel == "C07R8DYAZMM" ? event.ts : event.thread_ts,
            text:
              `${aiReq.message || aiReq.comment} - \`${aiReq.type}\`` ||
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
            case "sassy":
              app.client.reactions.add({
                channel: event.channel,
                timestamp: event.ts,
                name: "warning",
              });
              break;
            case "geography":
              app.client.reactions.add({
                channel: event.channel,
                timestamp: event.ts,
                name: "old-map",
              });
              break;
            case "politics":
            case "political":
              app.client.reactions.add({
                channel: event.channel,
                timestamp: event.ts,
                name: "politics",
              });
              break;
            case "info":
            case "repetition":
            case "inform":
            case "math":
            case "informative":
            case "reverse":
            case "neutral":
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
          for (const r of [...aiReq.reactions, aiReq.type]) {
            try {
              await app.client.reactions.add({
                channel: event.channel,
                timestamp: event.ts,
                name: r,
              });
            } catch (e) {}
          }
          await app.client.reactions.remove({
            channel: event.channel,
            timestamp: event.ts,
            name: "loading",
          });
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
