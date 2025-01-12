import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Bday implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/bday`;
    this.description = `Bday :D`;
  }
  run(app: ModifiedApp) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();
      // first make it store them
      // TODO
      const args = command.text.split(/ +/);
      const cmd = args.shift().toLowerCase();
      if (cmd == "config") {
        try {
          if (
            //@ts-ignore
            (
              await app.nocodb.dbViewRow.findOne(
                `noco`,
                "p63yjsdax7yacy4",
                "mgu9yv5wts3qmt2",
                "vwrz4wa8z4jhfo0y",
                {
                  fields: ["userID", "bday"],
                  where: `(userID,eq,${command.user_id})`,
                },
              )
            ).userID
          ) {
            await app.client.chat.postEphemeral({
              channel: command.channel_id,
              user: command.user_id,
              text: `:x: You already have a bday set`,
            });
            return;
          }
          const formatedDate = new Date(args.join(" "));
          // app.dbs.bday.set(command.user_id, formatedDate.toISOString());
          await app.nocodb.dbViewRow.create(
            `noco`,
            "p63yjsdax7yacy4",
            "mgu9yv5wts3qmt2",
            "vwrz4wa8z4jhfo0y",
            {
              userID: command.user_id,
              bday: formatedDate.toISOString().split("T")[0],
            },
          );
          await app.client.chat.postEphemeral({
            channel: command.channel_id,
            user: command.user_id,
            text: `:white_check_mark: Set your bday to ${formatedDate.toDateString()}, to change it run `,
          });
        } catch (e) {
          await app.client.chat.postEphemeral({
            channel: command.channel_id,
            user: command.user_id,
            text: `:x: Please use a valid date (eg: \`YYYY-MM-DD\` or \`1733888655020\`) (or i just broke)\n> ${e.message}`,
          });
        }
      } else if (cmd == "remove-my-data") {
        const ID = await app.nocodb.dbViewRow
          .findOne(
            `noco`,
            "p63yjsdax7yacy4",
            "mgu9yv5wts3qmt2",
            "vwrz4wa8z4jhfo0y",
            {
              fields: ["Id"],
              where: `(userID,eq,${command.user_id})`,
            },
          )
          //@ts-ignore
          .then((e) => e.Id);
        await app.nocodb.dbViewRow.delete(
          `noco`,
          "p63yjsdax7yacy4",
          "mgu9yv5wts3qmt2",
          "vwrz4wa8z4jhfo0y",
          ID,
        );
        // app.dbs.bday.delete(command.user_id);
        await app.client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: `:white_check_mark: Removed your bday data`,
        });
      }
    });
  }
}
