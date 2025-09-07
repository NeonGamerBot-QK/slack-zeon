import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import bcrypt from "bcrypt";
import { EncryptedJsonDb } from "../modules/encrypted-db";
export default class AnonDM implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `anondmfuncs`;
    this.description = `Pings zeon`;
  }
  run(app: ModifiedApp) {
    app.action("send_mail", async (par) => {
      const { action, ack, respond } = par;
      await ack();
      console.debug(`#action`, par);
      const user = par.body.user;
      // display user model

      await app.client.views.open({
        //@ts-ignore
        trigger_id: par.body.trigger_id,
        view: {
          type: "modal",
          callback_id: "send_mail_form",
          blocks: [
            {
              type: "input",
              element: {
                type: "multi_users_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select users",
                  emoji: true,
                },
                action_id: "multi_users_select-action",
              },
              label: {
                type: "plain_text",
                text: "Who do you want to dm (>10 people)",
                emoji: true,
              },
            },
            {
              type: "input",
              element: {
                type: "plain_text_input",
                multiline: true,
                action_id: "plain_text_input-action",
              },
              label: {
                type: "plain_text",
                text: "Your message",
                emoji: true,
              },
            },
            {
              type: "divider",
            },
            {
              type: "context",
              elements: [
                {
                  type: "plain_text",
                  text: "You may only send a letter if they have opened your other letter already & make sure it follows CoC",
                  emoji: true,
                },
              ],
            },
          ],
          title: {
            type: "plain_text",
            text: "Send Mail",
          },
          submit: {
            type: "plain_text",
            text: "Mail!",
          },
          close: {
            type: "plain_text",
            text: "Cancel",
          },
        },
      });
    });
    app.view("send_mail_form", async (par) => {
      const { ack, respond } = par;
      await ack();
      console.debug(`#view`, par.body.view.blocks, par.payload);
      // get modal data from inputs
      // WHY IS THE SLACK API LIKE THIS
      const theViewState = Object.values(par.body.view.state.values);
      const users = theViewState.find((e) => e["multi_users_select-action"])[
        "multi_users_select-action"
      ].selected_users;
      const textBox = theViewState.find((e) => e["plain_text_input-action"])[
        "plain_text_input-action"
      ].value;
      console.log(users, textBox);
      let ac_user_list = [];
      //@ts-ignore
      const usersInDb = Object.keys(app.dbs.anondm.storage);
      for (const user of users) {
        //check if a user is a robot
        // get user profile
        const userProfile = await app.client.users.profile.get({
          user: user,
        });
        //@ts-ignore
        if (userProfile.profile.bot_id) continue;
        if (await app.db.get(`optout_anondm_${user}`)) continue;
        if (usersInDb.find((e) => bcrypt.compareSync(user, e))) {
          if (
            app.dbs.anondm
              .get(usersInDb.find((e) => bcrypt.compareSync(user, e)))
              .messages.find((e) => {
                try {
                  EncryptedJsonDb.decrypt(
                    e,
                    `${user}_` + process.env.ANONDM_PASSWORD,
                  );
                  return true;
                } catch (e) {
                  return false;
                }
              })
          )
            continue;
        }
        // check if user already has a message from this user
        ac_user_list.push(user);
      }
      // im not letting u send it to more than 10 people
      ac_user_list = ac_user_list.slice(0, 10);
      const user = par.body.user;

      if (ac_user_list.length == 0) {
        await app.client.chat.postEphemeral({
          channel: user.id,
          user: user.id,
          text: `There are no users to send to :( (at least that im allowed to send to)`,
        });
        return;
      }

      for (const u of ac_user_list) {
        // first create an entry
        let userProfile = null;
        let user_id = null;
        // @ts-ignore
        const userInDb = usersInDb.find((e) => bcrypt.compareSync(u, e));
        if (userInDb) {
          userProfile = app.dbs.anondm.get(userInDb);
          user_id = usersInDb;
        } else {
          // create user profile
          user_id = bcrypt.hashSync(u, 10);
          app.dbs.anondm.set(user_id, {
            messages: [],
          });
          userProfile = app.dbs.anondm.get(user_id);
        }
        // userProfile =
        userProfile.messages.push(
          EncryptedJsonDb.encrypt(
            JSON.stringify({
              message: textBox,
            }),
            `${u}_` + process.env.ANONDM_PASSWORD,
          ),
        );
        // add the sender for obfuscation/j identification now ig
        userProfile.messages.push(
          EncryptedJsonDb.encrypt(
            JSON.stringify({
              message: textBox,
            }),
            `${user.id}_` + process.env.ANONDM_PASSWORD,
          ),
        );
        // send noti to the target
        await app.client.chat.postMessage({
          channel: u,
          text: `You have new mail! :email_unread:`,
        });
        app.dbs.anondm.set(user_id, userProfile);
      }
      await app.client.chat.postMessage({
        channel: `C085S8533LJ`,
        text: `:incoming_envelope: mail has been sent out to ${ac_user_list.length} people!`,
      });
      await app.client.chat.postEphemeral({
        channel: user.id,
        user: user.id,
        text: `Your mail has been sent to ${ac_user_list.length} users`,
      });
    });
    app.action(/open_mail_[A-Za-z]+/, async (par) => {
      const { action, ack, respond } = par;
      await ack();
      //@ts-ignore
      const userID = action.action_id.split("_")[2] as string;
      //@ts-ignore
      const userHash = Object.keys(app.dbs.anondm.storage).find((e) =>
        bcrypt.compareSync(userID, e),
      );
      //@ts-ignore
      const mail_index = action.value as string;
      const user = par.body.user;
      const message = app.dbs.anondm.get(userHash).messages[mail_index];
      try {
        const decrypted = EncryptedJsonDb.decrypt(
          message,
          `${userID}_` + process.env.ANONDM_PASSWORD,
        );
        const parsed = JSON.parse(decrypted);
        await app.client.chat.postEphemeral({
          channel: user.id,
          user: user.id,
          text: `:fire::email::fire: Your blind mail (its been deleted now)\n> ${parsed.message}`,
        });

        let instance = app.dbs.anondm.get(userHash);

        instance.messages = instance.messages.filter((e, i) => i != mail_index);
        app.dbs.anondm.set(userHash, instance);
        // send mail open noti
        await app.client.chat.postMessage({
          channel: `C085S8533LJ`,
          text: `:email_unread: someone has read a piece of mail`,
        });
      } catch (e) {
        await app.client.chat.postEphemeral({
          channel: user.id,
          user: user.id,
          text: `:x: Your mail is corrupted! I have no idea what happened to it tbh..\nSend this to neon: \`${e.message}\` mail index: ${mail_index}`,
        });
      }
      // display user model
      // await app.client.chat
      // .postMessage({
      //   channel: user.id,
      //   text: `You have sent a mail to ${user.name} (test)`,
      // });
    });

    // creation of mail :')
    // // display user model
    // await app.client.chat.postMessage({
    //   channel: user.id,
    //   text: `You have sent a mail to ${user.name} (test)`,
    // });
  }
}
