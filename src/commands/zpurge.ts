import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Zpurge implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/zpurge`;
    this.description = `Purge messages - Usage: /zpurge <amount> [user_id (defaults to you)] [thread_ts]`;
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
      
      // Default to command user's ID if no user specified
      const userId = args[1] || command.user_id;
      const threadTs = args[2]; // Optional thread timestamp

      // check if user exists
      try {
        const user = await app.client.users.info({ user: userId });
        if (!user.ok) {
          return respond(`:x: User <@${userId}> does not exist.`);
        }
        // check if users are admin
        //@ts-ignore
        if (user.user.is_admin) {
          return respond(
            `:x: User <@${userId}> is an admin. Cannot directly purge messages from admin.`,
          );
        }
      } catch (e) {
        return respond(`:x: Failed to fetch user info for <@${userId}>: ${e.message}`);
      }

      const purgeMessage = await app.client.chat.postMessage({
        text: `:spin-loading: Purging \`${amount}\` messages from user <@${userId}>${threadTs ? ` in thread \`${threadTs}\`` : ""}`,
        channel: command.channel_id,
      });

      // If thread_ts provided, get thread replies, otherwise get channel history
      let currentMessages;
      try {
        currentMessages = threadTs
          ? await app.client.conversations.replies({
              channel: command.channel_id,
              ts: threadTs,
              limit: amount || 100,
            })
          : await app.client.conversations.history({
              channel: command.channel_id,
              limit: amount || 100,
            });
      } catch (e) {
        await app.client.chat.update({
          channel: command.channel_id,
          ts: purgeMessage.ts,
          text: `:x: Failed to fetch messages: ${e.message}`,
        });
        return;
      }
      let cleared_messages = 0;
      let failed_messages = 0;
      for (const msg of currentMessages.messages) {
        // Filter by user ID
        if (msg.user !== userId) continue;
        if (cleared_messages >= amount) break;
        if (msg.ts === purgeMessage.ts) continue;
        try {
          await app.client.chat.delete({
            channel: command.channel_id,
            ts: msg.ts,
          });
          cleared_messages++;
        } catch (e) {
          console.error("Failed to delete message:", e.message);
          failed_messages++;
        }
      }
      await app.client.chat.postMessage({
        channel: command.channel_id,
        reply_broadcast: true,
        thread_ts: purgeMessage.ts,
        text: `:white_check_mark: Purged \`${cleared_messages}\` messages from user <@${userId}>${threadTs ? ` in thread \`${threadTs}\`` : ""}\nTook \`${Math.floor((Date.now() - stamp) / 1000)}s\`${failed_messages > 0 ? `\n:warning: Failed to delete ${failed_messages} messages` : ""}`,
      });
    });
  }
}
