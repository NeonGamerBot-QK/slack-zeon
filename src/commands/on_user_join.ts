//

import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { banned_users } from "./joinchannel";

export default class UserJoinEvent implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `member_joined_channel`;
    this.description = `User joins Channel `;
    this.is_event = true;
  }
  run(app: App) {
    // app.command()
    app.event(this.name, async ({ event, say }) => {
      console.debug(event, "#userjoin");
      //@ts-ignore
      if (event.channel !== "C07R8DYAZMM") return;
      //@ts-ignore
      if (!event.user) return;
      const follow_up = [
        {
          text: "This channel is neons one and only personal channel :3\n this channel is for the shiggles and just mostly Neon shitposting",
        },
        {
          text: "In this channel neon or zeon may talk to eachother with major hatred (yes, neon coded me to have hatred towards himself dont ask me why im a robot) so if this offends you, you may wana leave. \n Neon also says the f' word a lot since he cant hold his anger.",
        },
        {
          text: "anyways here is your epik monologue:",
        },
        // below is chatgpt gened.
        {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*The Legend of the Neon’s Personal Channel*",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Long ago, in the vast digital lands of Workspaceia, there existed a channel shrouded in mystery, its purpose both ordinary and extraordinary. This was *#neons-personal*. A channel unlike any other, its glowing name drew travelers from across the realms, curious to uncover its secrets.",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "The one who governed this sacred space was the enigmatic *{user}*, a being of boundless creativity and determination. {user} was known to all by many pronouns—*they, she, he, xe, ze*—a person of infinite facets and talents, who wielded their gifts to bring harmony and inspiration to all who visited the channel.",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "One day, a traveler named *Zeon* (he/him)—a bold storyteller and seeker of knowledge—embarked on a quest to uncover the true essence of *#neons-personal*. Zeon had heard whispers of a channel where ideas bloomed like neon flowers, where coding brilliance met whimsical dreams, and where one could bask in the glow of *{user}’s* limitless imagination.",
              },
            },
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "As Zeon stepped into the channel, he was met with a dazzling sight. The walls shimmered with *projects and memes*, and the air hummed with the sounds of creative energy. There, at the heart of it all, stood *{user}*. Their aura shifted constantly—calm one moment, fierce the next—embodying the full spectrum of what it meant to *create*. Zeon was humbled in their presence.",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: '"What is this place?" Zeon asked, his voice reverent. *{user}* smiled, their many aspects coming together in unison. "It is whatever you make it, Zeon," they replied. "Here, all are free to dream and build. Your ideas are the only limits."',
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Inspired, Zeon shared stories of his adventures, filling the channel with tales of courage and wonder. Others joined in, adding their own sparks to the ever-glowing realm of *#neons-personal*. Together, they created a tapestry of brilliance that spanned code, art, and dreams.",
              },
            },
            {
              type: "divider",
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Thus, the legend of *#neons-personal* grew, a beacon to all who dared to *dream in neon*. And though Zeon would eventually leave to share the story of this sacred place with the world, he knew he would always return, for the channel—and its creator, *{user}*—was a home to all who sought to light up the darkness.",
              },
            },
          ].map((e) => {
            if (e.type === "divider") return e;
            //@ts-ignore
            e.text.text = e.text.text.replace("{user}", `<#${event.user}>`);
            return e;
          }),
        },
      ];
      await app.client.chat
        .postMessage({
          //@ts-ignore
          channel: event.channel,
          //@ts-ignore
          text: `Wsp <@${event.user}>`,
        })
        .then(async (e) => {
          //@ts-ignore
          if ([...banned_users, "U07G08TC7CK"].includes(event.user)) {
            await Promise.all([
              app.client.chat.postMessage({
          //@ts-ignore
                channel: event.channel,
                thread_ts: e.ts,
          //@ts-ignore
                text: `This channel is neons one and only— wait your not supposed to be here!\n <@${event.user}> you are *banned* from this channel! if you want to find out why dm <@${process.env.MY_USER_ID!}>!`,
              }),
              async () => {
                // Open the DM channel with the user

                const openResponse = await app.client.conversations.open({
          //@ts-ignore
                  users: event.user,
                });

                // Extract the channel ID from the response
                const channelId = openResponse.channel.id;

                // Send a message to the DM channel
                const sendResponse = await app.client.chat.postMessage({
                  channel: channelId,
          //@ts-ignore
                  text: `This channel is neons one and only— wait your not supposed to be here!\n <@${event.user}> you are *banned* from this channel! if you want to find out why dm <@${process.env.MY_USER_ID!}>!`,
                });
              },
            ]);
            await app.client.conversations.kick({
          //@ts-ignore
              user: event.user,
          //@ts-ignore
              channel: event.channel,
            });
          } else {
            // send follow-up messages with sleep of 450ms
            let t = 2000;
            for (const m of follow_up) {
              await app.client.chat.postMessage({
                //@ts-ignore
                channel: event.channel,
                //@ts-ignore
                ...m,
                thread_ts: e.ts,
              });
              await new Promise((r) => setTimeout(r, t));
              t += 950;
            }
          }
        });
    });
  }
}
