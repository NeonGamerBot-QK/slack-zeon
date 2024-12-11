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
      // testing channel id atm
      await app.client.chat.postMessage({
        channel: "C07LGLUTNH2",
        text: `Happy Bday <@${user}> you are ${age} years old!! ${isOver18 ? `Congrats on becoming allumani UNC` : ``}\n you can view this here: https://slack.mybot.saahild.com`,
      });
    }
  }
}
export function startBdayCron(app: ModifiedApp) {
  cron.schedule("0 0 * * *", async () => {
    cronFunc(app);
  });
}
