//@ts-nocheck
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
// In-memory storage for polls and votes cuzzz im lazy
const polls = {};

export default class ZeonPoll implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/zeonpoll`;
    this.description = `Pings zeon`;
  }
  run(app: App) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(`:x: You cannot use this command.`);

      // respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
      //   console.debug(`after ping`, d);
      // });
      //todo: open poll
      // do denopoll stuff :3
      // feat: timed polls
      // @see https://github.com/polypixeldev/denopoll
      try {
        const [question, ...options] = command.text.split(',');
        if (!question || options.length < 2) {
          await client.chat.postEphemeral({
            channel: command.channel_id,
            user: command.user_id,
            text: 'Provide a question and at least two options, separated by commas.'
          });
          return;
        }
    
        const pollId = `poll_${Date.now()}`;
        polls[pollId] = {
          question: question.trim(),
          options: options.map((opt) => opt.trim()),
          votes: {}, // Map of user IDs to selected options
          allowMultiple: true, // Allow multiple votes per user
          anonymous: true // Anonymize votes
        };
    
        const blocks = [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*${polls[pollId].question}*` }
          },
          ...polls[pollId].options.map((option, index) => ({
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: option },
                value: `${pollId}_${index}`,
                action_id: `vote_${pollId}_${index}`
              }
            ]
          })),
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Add Option' },
                action_id: `add_option_${pollId}`
              }
            ]
          }
        ];
    
        await app.client.chat.postMessage({
          channel: command.channel_id,
          blocks,
          text: polls[pollId].question
        });
      } catch (error) {
        console.error(error);
      }
    });

// Handle votes
app.action(/vote_poll_\d+_\d+/, async ({ action, ack, client, body }) => {
  await ack();

  const [pollId, optionIndex] = action.value.split('_').slice(1);
  const userId = body.user.id;

  if (!polls[pollId]) return;

  if (!polls[pollId].allowMultiple && polls[pollId].votes[userId]) {
    await client.chat.postEphemeral({
      channel: body.channel.id,
      user: userId,
      text: 'You can only vote once in this poll.'
    });
    return;
  }

  if (!polls[pollId].votes[userId]) polls[pollId].votes[userId] = [];
  polls[pollId].votes[userId].push(parseInt(optionIndex));

  await client.chat.postEphemeral({
    channel: body.channel.id,
    user: userId,
    text: polls[pollId].anonymous
      ? 'Your anonymous vote has been recorded.'
      : `You voted for: ${polls[pollId].options[optionIndex]}.`
  });
});

// Add a new option
app.action(/add_option_poll_\d+/, async ({ ack, client, body, action }) => {
  await ack();

  const pollId = action.action_id.split('_').slice(2).join('_');
  if (!polls[pollId]) return;

  await client.chat.postEphemeral({
    channel: body.channel.id,
    user: body.user.id,
    text: 'Send a new option for the poll by replying to this message.',
    thread_ts: body.message.ts
  });

  polls[pollId].pendingUser = body.user.id;
});

  }
}
