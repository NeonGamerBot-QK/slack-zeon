import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Zpurge implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/zpurge`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(`:x: You cannot use this command :P`);
      let args = command.text.split(" ");
      if (args.length < 1)
        return respond(
          `:x: You need to specify a number of messages to purge. :P`,
        );
      let amount: string | number = args[0];
      //@ts-ignore
      if (isNaN(amount))
        return respond(
          `:x: You need to specify a number of messages to purge.`,
        );
      amount = parseInt(amount);
      if (amount < 0 || amount > 100)
        return respond(
          `:x: You need to specify a valid number of messages to purge. (must be under 100 and above 0)`,
        );
      const userId = args[1];
      if (userId) {
        // check if user exists
        const user = await app.client.users.info({ user: userId }).catch(e=> ({ok: false}));
        if (!user.ok) return respond(`:x: User ${userId} does not exist.`);
        // check if users are admin
       //@ts-ignore
        if (user.user.is_admin)
          return respond(
            `:x: User ${userId} is  an admin. Cannot directly purge messages from admin.`,
          );
      }
      const purgeMessage = await app.client.chat.postMessage({
        text: `:spin-loading: Purging \`${amount}\` messages ${userId ? `from user <@${userId}>` : ""}`,
        channel: command.channel_id,
      });
      const currentMessages = await app.client.conversations.history({
        channel: command.channel_id,
        count: amount || 100,
      });
      let cleared_messages = 0;
      for (const msg of currentMessages.messages) {
        if (userId) {
          if (msg.user !== userId) continue;
        }
        if (cleared_messages >= amount) break;
        if (msg.ts === purgeMessage.ts) continue;
        try {
          await app.client.chat.delete({
            channel: command.channel_id,
            ts: msg.ts,
          });
          cleared_messages++;
        } catch (e) {
          console.error(e);
        }
      }
      await app.client.chat.postMessage({
        channel: command.channel_id,
        reply_broadcast: true,
        thread_ts: purgeMessage.ts,
        text: `:white_check_mark: Purged \`${cleared_messages}\` messages ${userId ? `from user <@${userId}>` : ""}\nTook \`${Math.floor((Date.now() - stamp) / 1000)}s\``,
      });
    });
  }
}
