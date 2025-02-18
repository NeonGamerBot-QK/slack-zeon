//@ts-nocheck
import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

const dev_ch_id = "C083C2ABX4K"
export default class UserJoinEvent implements Command {
    name: string;
    description: string;
    is_event?: boolean;
    constructor() {
      this.name = `member_joined_channel`;
      this.description = `User no join channel `;
      this.is_event = true;
    }
    run(app: ModifiedApp) {
        let prod_channel_id = null;
      // app.command()
      app.event(this.name, async ({ event, say }) => {
          console.debug(event, "#userjoin");
             //@ts-ignore
             const { user, channel } = event;
       if(!prod_channel_id) {
        const channelInfo = await app.client.conversations.info({
            channel: channel,
          });
      
          const channelName = channelInfo.channel.name;
        //@ts-ignore
          if (event.channel !== dev_ch_id && channelName !== "u-cant-join-this-channel") return;
          prod_channel_id = channelInfo.channel.id;
       } else {
        if (event.channel !== prod_channel_id) return;
       }    
       
          //@ts-ignore
        await app.client.conversations.kick({
            channel: channel,
            users: user,
        });
          //@ts-ignore
          await app.client.chat.postMessage({
            //@ts-ignore 
              channel,
              //@ts-ignore
              text: `You cant join <@${user}>`
          })
      });
    }
  }
  