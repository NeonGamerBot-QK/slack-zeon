import { ModifiedApp } from "./slackapp";
import cron from "node-cron";

export async function cronFunc(app: ModifiedApp) {
  const today = new Date();
  for (const [user, bday] of Object.entries(app.dbs.bday.JSON())) {
    const date = new Date(bday);
    if (
      date.getDate() == today.getDate() &&
      date.getMonth() == today.getMonth()
    ) {
      const age = today.getFullYear() - date.getFullYear();
      const isOver18 = age >= 18;
      // happy bday ofc
      await app.client.chat
        .postMessage({
          channel: "C07RW1666UV",
          text: `:birthday: Happy Bday <@${user}> :birthday_dino: you are ${age} years old!! ${isOver18 ? `Congrats on becoming allumani UNC` : ``}\n you can view this here: https://slack.mybot.saahild.com/bday?u=${user}\n Everyone wish them happy birthday in the :thread:`,
        })
        .then((e) => {
          // forward message to user
          app.client.chat.postMessage({
            channel: user,
            text: `Happy Bday!\n You are now ${age} years old!! ${isOver18 ? `Congrats on becoming allumani UNC` : ``}\n you can view this here: https://slack.mybot.saahild.com/bday?u=${user}`,
          });
        });
    }
  }
}
export function startBdayCron(app: ModifiedApp) {
  cron.schedule("0 0 * * *", async () => {
    cronFunc(app);
  });
}
