import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
// i might provide reasons if i dont, i prob wont tell you
export const banned_users = [
  // if i get leave my own channel i WILL be banning myself to remember that im an idiot
  process.env.MY_USER_ID,
  "U07NKS9S8GZ",
  // no workspace owners lmao :3 (zrl, max) - anyways they found out
  "U0261EB1EG7",
  // u got deactivated 3 times () = bad
  "U07BMK9NSDB",
  "U020X4GCWSF",
  // no unless required
  "U07B4QD9F61",
  "U05A3TSL7UY",
  // other bans w/ no reason below
  "U079UHJDBRT",
];
export default class JoinNeonschannel implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/joinneonschannel`;
    this.description = `Join Neons channel`;
  }
  run(app: App) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      //   const stamp = Date.now();
      await ack();
      try {
        await app.client.chat.postMessage({
          text: `<@${command.user_id}> is trying to join <#C07R8DYAZMM>...`,
          channel: "C07LGLUTNH2",
        });
      } catch (e) {}
      // if (onlyForMe(command.user_id))
      //   return respond(`:x: you are the channel owner.`);
      try {
        if (banned_users.includes(command.user_id)) {
          await app.client.conversations.invite({
            channel: "C070HPBQ65P",
            users: command.user_id,
          });
        } else {
          await app.client.conversations.invite({
            channel: "C07R8DYAZMM",
            users: command.user_id,
          });
        }
      } catch (e) {
        respond(`:x: Failed, maybe you are already in the channel?!`);
      }
    });
  }
}
