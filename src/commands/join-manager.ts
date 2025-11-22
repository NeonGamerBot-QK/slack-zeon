import { App } from "@slack/bolt";
import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import { getChannelManagers } from "../modules";

interface JoinConfig {
  enabled: boolean;
  bannedUsers: string[];
  trustRequired: boolean;
  logChannel?: string;
}

export default class JoinManager implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/allowjoins`;
    this.description = `Manage channel joining settings`;
  }

  run(app: ModifiedApp) {
    // --- Action Handlers for Approval Flow ---
    app.action("approve_join", async ({ body, action, ack, client }) => {
      await ack();
      if (body.type !== "block_actions" || !("value" in action)) return;

      try {
        const data = JSON.parse(action.value);
        const { requesterId, channelId } = data;
        const approverId = body.user.id;

        // Invite user
        try {
          await client.conversations.invite({
            channel: channelId,
            users: requesterId
          });

          // Update DM to show approved
          await client.chat.update({
            channel: body.channel!.id,
            ts: body.message!.ts,
            text: `✅ Approved request from <@${requesterId}> to join <#${channelId}>.`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `✅ You approved <@${requesterId}>'s request to join <#${channelId}>.`
                }
              }
            ]
          });

          // Notify requester
          await client.chat.postMessage({
            channel: requesterId,
            text: `🎉 <@${approverId}> approved your request to join <#${channelId}>!`
          });

          // Log if configured
          const config: JoinConfig = await app.dbs.joinchanneldb.get(channelId);
          if (config?.logChannel) {
            await client.chat.postMessage({
              channel: config.logChannel,
              text: `✅ <@${requesterId}> joined <#${channelId}> (Approved by <@${approverId}>).`
            }).catch(() => { });
          }

        } catch (e: any) {
          const errorMsg = e.data?.error || e.message;
          await client.chat.postMessage({
            channel: body.channel!.id,
            text: `:x: Failed to invite <@${requesterId}>: ${errorMsg}`
          });
        }

      } catch (e) {
        console.error("Error processing join approval", e);
      }
    });

    app.action("deny_join", async ({ body, action, ack, client }) => {
      await ack();
      if (body.type !== "block_actions" || !("value" in action)) return;

      try {
        const data = JSON.parse(action.value);
        const { requesterId, channelId } = data;

        // Update DM to show denied
        await client.chat.update({
          channel: body.channel!.id,
          ts: body.message!.ts,
          text: `🚫 Denied request from <@${requesterId}> to join <#${channelId}>.`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🚫 You denied <@${requesterId}>'s request to join <#${channelId}>.`
              }
            }
          ]
        });

        // Notify requester (optional, but polite)
        await client.chat.postMessage({
          channel: requesterId,
          text: `🚫 Your request to join <#${channelId}> was denied.`
        });

      } catch (e) {
        console.error("Error processing join denial", e);
      }
    });

    // --- Command: /join @User ---
    app.command("/joinchannel", async ({ command, ack, respond }) => {
      await ack();
      const targetUserText = command.text.trim();
      const userMatch = targetUserText.match(/<@([A-Z0-9]+)\|?.*>/);

      if (!userMatch) {
        return respond({ text: ":x: Please specify a user to join their channel. Usage: `/join @User`", response_type: "ephemeral" });
      }

      const targetUserId = userMatch[1];

      // Lookup which channel this user owns/linked
      const targetChannelId = await app.dbs.userjoindb.get(targetUserId);

      if (!targetChannelId) {
        return respond({ text: `:x: <@${targetUserId}> has not linked a channel to their profile yet.`, response_type: "ephemeral" });
      }

      const config: JoinConfig = await app.dbs.joinchanneldb.get(targetChannelId);

      if (!config || !config.enabled) {
        return respond({ text: ":x: The target channel is not configured to accept joins.", response_type: "ephemeral" });
      }

      if (config.bannedUsers.includes(command.user_id)) {
        return respond({ text: ":x: You are banned from joining this channel.", response_type: "ephemeral" });
      }

      // Check Trust Factor
      if (config.trustRequired) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const trustData = await fetch(
            `https://hackatime.hackclub.com/api/v1/users/${command.user_id}/stats?start_date=${today}&end_date=${today}`
          ).then(r => r.json());

          if (trustData.trust_factor?.trust_level === "red") {
            if (!config.bannedUsers.includes(command.user_id)) {
              config.bannedUsers.push(command.user_id);
              await app.dbs.joinchanneldb.set(targetChannelId, config);
            }
            return respond({ text: ":x: Your trust factor is too low (Red). You have been banned.", response_type: "ephemeral" });
          }
        } catch (e) {
          console.error("Trust factor check failed", e);
        }
      }

      // Send Approval Request to Target User (Owner)
      try {
        await app.client.chat.postMessage({
          channel: targetUserId, // DM the owner
          text: `📢 New Join Request! <@${command.user_id}> wants to join <#${targetChannelId}>.`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `📢 *New Join Request*\n<@${command.user_id}> wants to join your channel <#${targetChannelId}>.`
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Approve ✅" },
                  style: "primary",
                  action_id: "approve_join",
                  value: JSON.stringify({ requesterId: command.user_id, channelId: targetChannelId })
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "Deny 🚫" },
                  style: "danger",
                  action_id: "deny_join",
                  value: JSON.stringify({ requesterId: command.user_id, channelId: targetChannelId })
                }
              ]
            }
          ]
        });

        respond({ text: `:white_check_mark: Request sent to <@${targetUserId}>.`, response_type: "ephemeral" });

      } catch (e) {
        console.error("Failed to send DM", e);
        respond({ text: ":x: Failed to send request to the channel owner. They might need to update their settings.", response_type: "ephemeral" });
      }
    });

    // --- Command: /allowjoins ---
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      const args = command.text.trim().split(/\s+/);
      const action = args[0]?.toLowerCase();

      // Check channel privacy and creator
      let isPrivate = false;
      let creator = "";
      try {
        const info = await app.client.conversations.info({ channel: command.channel_id });
        isPrivate = !!info.channel?.is_private;
        creator = info.channel?.creator || "";
      } catch (e) {
        console.error("Failed to fetch channel info", e);
      }

      if (!isPrivate) {
        return respond({ text: ":x: This command is only available for private channels.", response_type: "ephemeral" });
      }

      // Manager Check
      let managers: string[] = [];
      try { managers = await getChannelManagers(command.channel_id); } catch (e) { }

      if (!managers.includes(command.user_id) && command.user_id !== creator && command.user_id !== "U07NKS9S8GZ") {
        return respond({ text: ":x: You must be a channel manager or the creator to use this command.", response_type: "ephemeral" });
      }

      let config: JoinConfig = await app.dbs.joinchanneldb.get(command.channel_id) || {
        enabled: false,
        bannedUsers: [],
        trustRequired: false
      };

      switch (action) {
        case "link": // Link this channel to the user
          await app.dbs.userjoindb.set(command.user_id, command.channel_id);
          respond({ text: `:link: You have linked <#${command.channel_id}> to your account. Users can now join via \`/join <@${command.user_id}>\`.`, response_type: "ephemeral" });
          break;

        case "enable":
          config.enabled = true;
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          respond({ text: `:white_check_mark: Joins enabled. Don't forget to \`/allowjoins link\` if you want people to find it via your name!`, response_type: "ephemeral" });
          break;

        case "disable":
          config.enabled = false;
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          respond({ text: ":no_entry_sign: Joins disabled.", response_type: "ephemeral" });
          break;

        case "ban":
          const userToBan = args[1]?.match(/<@([A-Z0-9]+)\|?.*>/)?.[1] || args[1];
          if (userToBan) {
            if (!config.bannedUsers.includes(userToBan)) config.bannedUsers.push(userToBan);
            await app.dbs.joinchanneldb.set(command.channel_id, config);
            respond({ text: `:hammer: Banned <@${userToBan}> from joining.`, response_type: "ephemeral" });
          } else {
            respond({ text: "Usage: `/allowjoins ban @user`", response_type: "ephemeral" });
          }
          break;

        case "unban":
          const userToUnban = args[1]?.match(/<@([A-Z0-9]+)\|?.*>/)?.[1] || args[1];
          if (userToUnban) {
            config.bannedUsers = config.bannedUsers.filter(u => u !== userToUnban);
            await app.dbs.joinchanneldb.set(command.channel_id, config);
            respond({ text: `:angel: Unbanned <@${userToUnban}>.`, response_type: "ephemeral" });
          } else {
            respond({ text: "Usage: `/allowjoins unban @user`", response_type: "ephemeral" });
          }
          break;

        case "trust":
          const state = args[1]?.toLowerCase();
          if (state === "on" || state === "true") config.trustRequired = true;
          else if (state === "off" || state === "false") config.trustRequired = false;
          else return respond({ text: "Usage: `/allowjoins trust on|off`", response_type: "ephemeral" });
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          respond({ text: `Trust requirement set to: ${config.trustRequired}`, response_type: "ephemeral" });
          break;

        case "log":
          const channelMatch = args[1]?.match(/<#(C[A-Z0-9]+)\|?.*>/);
          const channel = channelMatch ? channelMatch[1] : args[1];
          if (channel && channel.startsWith("C")) {
            config.logChannel = channel;
            respond({ text: `Log channel set to <#${channel}>`, response_type: "ephemeral" });
          } else {
            delete config.logChannel;
            respond({ text: `Log channel cleared.`, response_type: "ephemeral" });
          }
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          break;

        case "status":
        default:
          respond({
            text: `*Join Configuration for <#${command.channel_id}>*\nEnabled: \`${config.enabled}\`\nTrust Required: \`${config.trustRequired}\`\nBanned Users: ${config.bannedUsers.length}\nLog Channel: ${config.logChannel ? `<#${config.logChannel}>` : "None"}\n\nUsage: \`/allowjoins [link|enable|disable|ban|unban|trust|log]\``,
            response_type: "ephemeral"
          });
          break;
      }
    });
  }
}
