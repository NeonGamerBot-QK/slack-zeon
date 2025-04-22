import { getChannelManagers } from "../modules";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/stickymessage`;
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
        case "create":
        case "new":
          if (args.length === 0) {
            respond({
              text: `:x: You must provide a message to create a sticky message.`,
              response_type: "ephemeral",
            });
            return;
          }
          // yes im making you have to fit it in the command text
          // #nomodalsforme
          const textToStickyCreate = args.join(" ");
          if (app.dbs.stickymessages.get(command.channel_id)) {
            respond({
              text: `:x: You already have a sticky message.\nto update it run \`/stickymessage edit ${textToStickyCreate}\``,
              response_type: "ephemeral",
            });
            return;
          }

          try {
            const msg = await app.client.chat.postMessage({
              channel: command.channel_id,
              text: `:sticky-note: ${textToStickyCreate}`,
            });
            app.dbs.stickymessages.set(command.channel_id, {
              message: textToStickyCreate,
              ts: msg.ts,
              lastTriggered: Date.now(),
            });
            respond({
              text: `Sticky message created`,
              response_type: "ephemeral",
            });
          } catch (e) {
            respond({
              text: `:x: Error creating sticky message?\n am i in the channel...`,
              response_type: "ephemeral",
            });
          }

          break;
        case "remove":
        case "rm":
          if (!app.dbs.stickymessages.get(command.channel_id)) {
            respond({
              text: `:x: You don't have a sticky message to remove.`,
              response_type: "ephemeral",
            });
            return;
          }
          const dbEntryToRemove = app.dbs.stickymessages.get(
            command.channel_id,
          );
          try {
            await app.client.chat.delete({
              channel: command.channel_id,
              ts: dbEntryToRemove.ts,
            });
            app.dbs.stickymessages.delete(command.channel_id);
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
        case "edit":
        case "update":
          if (!app.dbs.stickymessages.get(command.channel_id)) {
            respond({
              text: `:x: You don't have a sticky message to edit.`,
              response_type: "ephemeral",
            });
            return;
          }

          const dbEntryToEdit = app.dbs.stickymessages.get(command.channel_id);
          const textToEdit = args.join(" ");
          try {
            await app.client.chat.update({
              channel: command.channel_id,
              ts: dbEntryToEdit.ts,
              text: textToEdit,
            });
            app.dbs.stickymessages.set(command.channel_id, {
              message: textToEdit,
              ts: dbEntryToEdit.ts,
              lastTriggered: Date.now(),
            });
            respond({
              text: `Sticky message edited`,
              response_type: "ephemeral",
            });
            return;
          } catch (e) {
            respond({
              text: `:x: Error editing sticky message?\n am i in the channel...`,
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
    app.event("message", async ({ event, client, body }) => {
      const dbEntry = app.dbs.stickymessages.get(event.channel);
      if (event.subtype) return;
      //@ts-ignore
      if (event.thread_ts) return;
      if (!dbEntry) return;
      if (dbEntry.lastTriggered && Date.now() - dbEntry.lastTriggered < 1000)
        return;
      //@ts-ignore
      //   if (event.text === dbEntry.message) return;
      if (dbEntry.ts === event.ts) return;
      //   console.log(event, dbEntry);
      await new Promise((r) => setTimeout(r, 250));
      try {
        await app.client.chat.delete({
          channel: event.channel,
          ts: dbEntry.ts,
        });
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 50));
      if (dbEntry.lastTriggered && Date.now() - dbEntry.lastTriggered < 1000)
        return;
      try {
        const m = await client.chat.postMessage({
          channel: event.channel,
          text: `:sticky-note: ${dbEntry.message}`,
        });
        app.dbs.stickymessages.set(event.channel, {
          ts: m.ts,
          message: dbEntry.message,
          lastTriggered: Date.now(),
        });
        await new Promise((r) => setTimeout(r, 1000));
        const newDbInstanceThingy = app.dbs.stickymessages.get(event.channel);
        if (newDbInstanceThingy.ts !== m.ts) {
          try {
            await app.client.chat.delete({
              channel: event.channel,
              ts: newDbInstanceThingy.ts,
            });
          } catch (e) {}
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
}
