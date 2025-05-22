import { getChannelManagers } from "../modules";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/hoistchannel`;
    this.description = `sticky message`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      const stamp = Date.now();
      await ack();
      const args = command.text.split(" ");
      const subcmd = args.shift().toLowerCase();
      // check if the user is a channel manager
      const chm = [
        ...(await getChannelManagers(command.channel_id)),
        "U07L45W79E1",
      ];
      if (!chm.includes(command.user_id)) {
        return respond({
          text: `:x: You cannot use this command. You must be a channel manager to use this command.`,
          response_type: "ephemeral",
        });
      }

      switch (subcmd) {
        case "lock":
          if (args.length === 0) {
            respond({
              text: `:x: You must provide a message to create a sticky message.`,
              response_type: "ephemeral",
            });
            return;
          }
          if (app.dbs.channelhoisterdb.get(command.channel_id)) {
            respond({
              text: `:x: You already have enabled a watcher for this channel.`,
              response_type: "ephemeral",
            });
            return;
          }

          try {
            const info = await app.client.conversations.info({
              channel: command.channel_id,
            });
            app.dbs.channelhoisterdb.set(command.channel_id, {
              name: info.channel.name!,
              usersToAdd: await getChannelManagers(command.channel_id),
              lastTriggered: Date.now(),
              createdChannelIds: [],
            });
            respond({
              text: `Channel being watched! make sure zeon stays in this channel or it could fail to watch it!`,
              response_type: "ephemeral",
            });
          } catch (e) {
            respond({
              text: `:x: Error... am i in the channel?`,
              response_type: "ephemeral",
            });
          }

          break;
        case "dehoist-channel":
          if (!app.dbs.channelhoisterdb.get(command.channel_id)) {
            respond({
              text: `:x: You don't have a sticky message to remove.`,
              response_type: "ephemeral",
            });
            return;
          }
          const dbEntryToRemove2 = app.dbs.channelhoisterdb.get(
            command.channel_id,
          );
          const channel0 = args[0];
          if (!channel0) {
            return respond({
              text: `:x: You must provide a channel to dehoist.`,
              response_type: "ephemeral",
            });
          }
          if (!dbEntryToRemove2.createdChannelIds.includes(channel0)) {
            return respond({
              text: `:x: This channel is not being hoisted.`,
              response_type: "ephemeral",
            });
          }
          const currentChannelInfo = await app.client.conversations.info({
            channel: channel0,
          });
          // rename channel
          await app.client.conversations.rename({
            channel: channel0,
            name: `${currentChannelInfo.channel.name}-${Date.now()}`,
          });
          respond({
            text: `Channel being dehoisted! make sure zeon stays in this channel or it could fail to watch it!`,
            response_type: "ephemeral",
          });
          break;
        case "remove":
        case "rm":
          if (!app.dbs.channelhoisterdb.get(command.channel_id)) {
            respond({
              text: `:x: You don't have a sticky message to remove.`,
              response_type: "ephemeral",
            });
            return;
          }
          const dbEntryToRemove = app.dbs.channelhoisterdb.get(
            command.channel_id,
          );
          try {
            app.dbs.channelhoisterdb.delete(command.channel_id);
            respond({
              text: `Sticky message removed`,
              response_type: "ephemeral",
            });
            return;
          } catch (e) {
            respond({
              text: `:x: Error removing sticky message?\n am i in the channel...`,
              response_type: "ephemeral",
            });
            return;
          }
          break;
        default:
          respond({
            text: `Unknown subcmd \`${subcmd}\``,
            response_type: "ephemeral",
          });
          break;
      }
    });
    // part 2 message
    app.event("channel_rename", async ({ event, client, body }) => {
      const channelId = event.channel.id;
      const cdata = await app.dbs.channelhoisterdb.get(channelId);
      if (!cdata) {
        return;
      }

      // create  priv channel and then invite users
      const channel = await client.conversations.create({
        name: `${cdata.name}`,
        is_private: true,
      });
      await client.conversations.invite({
        channel: channel.channel!.id,
        users: cdata.usersToAdd.join(","),
      });
      await app.client.chat.postMessage({
        channel: channel.channel.id,
        text: `Channel is hoisting this name.`,
      });
      cdata.createdChannelIds.push(channel.channel.id);
      await app.dbs.channelhoisterdb.set(channelId, cdata);
    });
  }
}
