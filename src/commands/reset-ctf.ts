import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import path from "path";
import fs from "fs";
import StegCloak from "stegcloak";

const stegcloak = new StegCloak(true, false);

function decrypt(str) {
  return stegcloak.reveal(str, process.env.CTF_PASSWORD);
}
const files = fs.readdirSync(path.join(__dirname, "../../ctf", "notes"));
export let already_reset_this_instance = false;
function parseTheSecrets() {
  return new Promise((res) => {
    let i = 0;
    let total = [];
    for (const file of files) {
      const data = fs
        .readFileSync(path.join(__dirname, "../../ctf/notes", file))
        .toString();
      total.push(JSON.parse(decrypt(data)));
      if (i == files.length - 1) {
        console.log("Done!");
        res(total);
      }
      i++;
    }
  });
}
export function createChannel(app: ModifiedApp, name: string, userIds = []) {
  return app.client.conversations
    .create({
      name: name,
      is_private: true,
    })
    .then((d) => {
      // console.log(d)
      app.client.conversations.invite({
        channel: d.channel.id,
        users: `${process.env.MY_USER_ID}${userIds.length > 0 ? "," : ""}${userIds?.join(",")}`,
      });
      // setTimeout(() => {
      // app.client.conversations.archive({
      // channel: d.channel.id
      // })
      // }, 120 * 1000)
      return d;
    });
}
export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/reset-ctf`;
    this.description = `Resets the CTF`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      if (!onlyForMe(command.user_id))
        return respond(`:x: You cannot use this command.`);

      // respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
      //   console.debug(`after ping`, d);
      // });
      const msg = await app.client.chat.postMessage({
        text: `Resetting CTF`,
        channel: command.channel_id,
      });
      // app.db.delete("ctf")
      const currentDbInstance = app.db.get("ctf");
      if (!currentDbInstance) {
        console.log(`First run! hopefully i dont fuck it up`);
        let compiledJSON: any = await parseTheSecrets();
        // insert this into the db? why: A: easier to add stuff, B: wawa idc about the db having unencrypted data
        app.db.set("ctf", compiledJSON);

        for (let j of compiledJSON) {
          if (j.bin_content) {
            // upload to hastebin
            await fetch(`https://bin.saahild.com/documents`, {
              method: "POST",
              body: j.bin_content,
            })
              .then((r) => r.json())
              .then((hd) => {
                j.bin_id = hd.key;
                // app.db.set("ctf", compiledJSON);
              });
          }
          if (j.create_channel) {
            let n = null;
            if (j.random_channel_name) n = Date.now().toString();
            if (j.channel_name_be_bin) n = j.bin_id;
            const ch = await createChannel(app, n);
            j.ch_id = ch.channel.id;
            if (j.channel_message) {
              await app.client.chat.postMessage({
                channel: ch.channel.id,
                text: j.channel_message,
              });
            }
            if (j["2nd_message"]) {
              await app.client.chat.postMessage({
                channel: ch.channel.id,
                text: j["2nd_message"]!,
              });
            }
            await new Promise((res) => setTimeout(res, 1000));
          }
          await new Promise((res) => setTimeout(res, 100));
        }
        app.db.set("ctf", compiledJSON);
        await app.client.chat.update({
          ts: msg.ts,
          channel: command.channel_id,
          text: `CTF was created successfully! \n> ${compiledJSON
            .filter((e) => e.ch_id)
            .map((e) => `<#${e.ch_id}>`)
            .join("\n> ")}`,
        });
      } else {
        // it exists; archive old channels and please UPDATE THE FUCKING KEY
        for (let j of currentDbInstance) {
          if (j.ch_id) {
            await app.client.chat
              .postMessage({
                channel: j.ch_id,
                text: `:x: CTF was reset! if this is not the final channel may or may not be transferred to the new channel!`,
              })
              .then(() => {
                setTimeout(() => {
                  app.client.conversations.archive({
                    channel: j.ch_id,
                  });
                }, 1500);
              });
          }
          // keep old bin links idgaf
        }
        // now delete the DB entry
        app.db.delete("ctf");
        already_reset_this_instance = true;
        app.client.chat.update({
          ts: msg.ts,
          channel: command.channel_id,
          text: `CTF was reset successfully!\n After *You update the key* please run this again :D\n Note: you cannot reset again until the bot is restarted...`,
        });
      }
    });
  }
}
