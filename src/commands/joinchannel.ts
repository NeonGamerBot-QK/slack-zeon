import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
// i might provide reasons if i dont, i prob wont tell you
export const banned_users = [
  // if i get leave my own channel i WILL be banning myself to remember that im an idiot
  process.env.MY_USER_ID,
  "U07NKS9S8GZ",
  // no workspace owners lmao :3 (zrl, max)
  "U0266FRGP",
  "U0C7B14Q3",
  // u got deactivated twice = bad
  "U07BMK9NSDB",
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
