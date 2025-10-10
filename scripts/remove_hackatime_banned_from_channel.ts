import "dotenv/config";
import { WebClient } from "@slack/web-api";
// todo polyl fill with a user id list
const users = [];
const channel = "C07R8DYAZMM";
const client = new WebClient(process.env.SLACK_BOT_TOKEN);
(async () => {
  for (const user of users) {
    try {
      const is_banned = await fetch(
        `https://hackatime.hackclub.com/api/v1/users/${user}/stats?features=projects&start_date=2025-07-01`,
      )
        .then((r) => r.json())
        .then((d) =>
          d.trust_factor ? d.trust_factor.trust_level == "red" : false,
        );
      console.log(`Checking ${user}`);
      if (!is_banned) continue;
      console.log(`Removing ${user} from ${channel}`);
      await client.conversations.kick({
        channel,
        user,
      });
    } catch (e) {
      console.log(`Error removing ${user} from ${channel}: ${e}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
})();
