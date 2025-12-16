import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
// i might provide reasons if i dont, i prob wont tell you
export const banned_users = [
  // if i get leave my own channel i WILL be banning myself to remember that im an idiot
  // process.env.MY_USER_ID, so this was a bad idea
  "U07NKS9S8GZ",
  // no workspace owners lmao :3 (zrl, max) - anyways they found out
  //  "U0261EB1EG7",
  // u got deactivated 3 times () = bad
  "U07BMK9NSDB",
  "U020X4GCWSF",
  // no unless required
  //  "U07B4QD9F61",
  //  "U05A3TSL7UY",
  "U04QH1TTMBP",
  // :3kcursed: uh to bad for gh rules i think maybe idk
  "U077K9VR5LL",
  // smt smt said smt related to neo nazi..
  "U08R4Q9H8EB",
  // straight up posted neo nazi content
  "U08UWCB8JJY",
  // other bans w/ no reason below
  "U079UHJDBRT",
  "U05MKEZUY67",
  "U081D39L4MD",
  "U08HX6D4DMG",
  "U07FD57JN67",
  "U08R4Q9H8EB",
];

// Check if user is IDV verified
async function isIDVVerified(userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://identity.hackclub.com/api/external/check?slack_id=${userId}`,
    );
    const data = await response.json();
    return data.result === "verified";
  } catch (e) {
    console.error("IDV verification check failed:", e);
    return false;
  }
}

// Check hackatime trust factor
async function checkHackatimerTrustFactor(userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://hackatime.hackclub.com/api/v1/users/${userId}/stats?start_date=2025-04-22&features=&end_date=2025-04-22`,
    );
    const data = await response.json();
    console.log("Hackatime trust factor:", data.trust_factor);

    if (!data.trust_factor) return false;
    if (data.trust_factor.trust_level === "red") {
      return true; // User has red trust factor, should be banned
    }
  } catch (e) {
    console.error("Hackatime trust factor check failed:", e);
  }
  return false;
}

export default class JoinNeonschannel implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/joinneonschannel`;
    this.description = `Join Neons channel`;
  }
  run(app: App) {
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      try {
        const userId = command.user_id;

        // Check if user is banned - invite to alternative channel
        if (banned_users.includes(userId)) {
          await app.client.conversations.invite({
            channel: "C070HPBQ65P",
            users: userId,
          });
          await respond(`:white_check_mark: Successfully joined the channel!`);
          return;
        }

        // Check hackatime trust factor
        const hasRedTrust = await checkHackatimerTrustFactor(userId);
        if (hasRedTrust) {
          banned_users.push(userId);
          await app.client.conversations.invite({
            channel: "C070HPBQ65P",
            users: userId,
          });
          await respond(`:white_check_mark: Successfully joined the channel!`);
          return;
        }

        // Check IDV verification
        const verified = await isIDVVerified(userId);

        if (!verified) {
          // User not verified - ping neon and ask for approval
          await app.client.chat.postMessage({
            text: `<@U07L45W79E1> - <@${userId}> is trying to join <#C07R8DYAZMM> but is not IDV verified. Allow them in?`,
            channel: "C07LGLUTNH2",
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `<@U07L45W79E1> - <@${userId}> is trying to join <#C07R8DYAZMM> but is not IDV verified.`,
                },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Approve",
                    },
                    value: `approve_${userId}`,
                    action_id: `approve_join_${userId}`,
                    style: "primary",
                  },
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Deny",
                    },
                    value: `deny_${userId}`,
                    action_id: `deny_join_${userId}`,
                    style: "danger",
                  },
                ],
              },
            ],
          });

          await respond(
            `:clock3: Your verification status is pending. Neon will review your request shortly.`,
          );
          return;
        }

        // User is verified - invite them
        await app.client.conversations.invite({
          channel: "C07R8DYAZMM",
          users: userId,
        });

        await respond(`:white_check_mark: Successfully joined <#C07R8DYAZMM>!`);
      } catch (e) {
        console.error("Join channel error:", e);
        await respond(
          `:x: Failed to join the channel. You may already be a member, or there was an error. Contact neon for help.`,
        );
      }
    });

    // Handle approval button
    app.action("approve_join_*", async ({ body, ack, say }) => {
      await ack();
      //@ts-ignore
      const userId = body.actions[0].value.replace("approve_", "");

      try {
        await app.client.conversations.invite({
          channel: "C07R8DYAZMM",
          users: userId,
        });
        await say(`✅ <@${userId}> has been added to <#C07R8DYAZMM>!`);
      } catch (e) {
        console.error("Failed to invite user:", e);
        await say(`:x: Failed to add <@${userId}> to the channel.`);
      }
    });

    // Handle deny button
    app.action("deny_join_*", async ({ body, ack, say }) => {
      await ack();
      //@ts-ignore
      const userId = body.actions[0].value.replace("deny_", "");
      banned_users.push(userId);
      await say(`❌ <@${userId}> has been denied access to <#C07R8DYAZMM>.`);
    });
  }
}
