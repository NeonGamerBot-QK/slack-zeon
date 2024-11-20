import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import path from "path";
import fs from "fs";
import StegCloak from "stegcloak";
import { already_reset_this_instance } from "./reset-ctf";

const stegcloak = new StegCloak(true, false);

function decrypt(str) {
  return stegcloak.reveal(str, process.env.CTF_PASSWORD);
}
const files = fs.readdirSync(path.join(__dirname, "../../ctf", "notes"));

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

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/submitflag`;
    this.description = `Submit flag`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      if (onlyForMe(command.user_id))
        return respond(`:x: Neon you cant do your own challange.`);
      if (already_reset_this_instance) {
        return respond(`:x: You cannot submit flags until the CTF is reset.`);
      }
      if (command.text.length < 2) {
        return respond(`:x: Please provide a flag.`);
      }

      // get users ctf data
      let userD = app.db.get("ctf_" + command.user_id) || {};

      // respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
      //   console.debug(`after ping`, d);
      // });
      const secrets = app.db.get("ctf");
      const validKey = secrets.find((e) => e.matches == command.text) as any;
      if (validKey) {
        userD.last_flag = command.text;
        userD.last_submit = Date.now();
        console.log(validKey);
        userD.current_flag = validKey.to_next;
        app.db.set("ctf_" + command.user_id, userD);
        // add user to next channel
        if (secrets.find((e) => e.matches == validKey.to_next).ch_id) {
          //@ts-ignore
          await app.client.conversations.invite({
            //@ts-ignore
            channel: secrets.find((e) => e.matches == validKey.to_next).ch_id,
            users: command.user_id,
          });
        }
        await app.client.chat.postEphemeral({
          user: command.user_id,
          channel: command.channel_id,
          text:
            validKey.message ||
            `:white_check_mark: Flag submitted successfully. You can find your flag in the next channel <#${secrets.find((e) => e.matches == validKey.to_next)?.ch_id}>`,
        });
      } else {
        respond(`:x: Invalid flag.`);
      }
    });
  }
}
