import { App, BlockAction, ViewSubmitAction } from "@slack/bolt";
import { Command } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import { getChannelManagers } from "../modules";

interface JoinConfig {
  enabled: boolean;
  bannedUsers: string[];
  trustRequired: boolean;
  logChannel?: string;
  questions?: string[];
}

export default class JoinManager implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/allowjoins`;
    this.description = `Manage channel joining settings`;
  }

  run(app: ModifiedApp) {
    // --- View Handler for Questionnaire ---
    app.view("join_questionnaire", async ({ ack, body, view, client }) => {
      await ack();

      const privateMetadata = JSON.parse(view.private_metadata);
      const { targetUserId, targetChannelId, requesterId } = privateMetadata;

      // Extract answers
      const answers: { question: string; answer: string }[] = [];
      const values = view.state.values;

      for (const blockId in values) {
        const actionId = Object.keys(values[blockId])[0];
        const answer = values[blockId][actionId].value;
        // Find the question text from the block (we can't easily get it from state,
        // so we rely on the order or reconstruct it, but passing it in metadata is heavy.
        // Simpler approach: The blockId was set to `q_${index}`.
        // We can fetch the config again to map index to question text.
        answers.push({ question: blockId, answer: answer || "" });
      }

      // Re-fetch config to get question text
      const config: JoinConfig =
        await app.dbs.joinchanneldb.get(targetChannelId);
      const questionTexts = config?.questions || [];

      const formattedAnswers = answers
        .map((a) => {
          const index = parseInt(a.question.split("_")[1]);
          const qText = questionTexts[index] || "Question";
          return `*${qText}*\n> ${a.answer}`;
        })
        .join("\n\n");

      // Send Approval Request to Target User (Owner)
      try {
        await client.chat.postMessage({
          channel: targetUserId,
          text: `📢 New Join Request! <@${requesterId}> wants to join <#${targetChannelId}>.`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `📢 *New Join Request*\n<@${requesterId}> wants to join your channel <#${targetChannelId}>.`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Questionnaire Answers:*\n\n${formattedAnswers}`,
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Approve ✅" },
                  style: "primary",
                  action_id: "approve_join",
                  value: JSON.stringify({
                    requesterId,
                    channelId: targetChannelId,
                  }),
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "Deny 🚫" },
                  style: "danger",
                  action_id: "deny_join",
                  value: JSON.stringify({
                    requesterId,
                    channelId: targetChannelId,
                  }),
                },
              ],
            },
          ],
        });

        // Notify requester
        await client.chat.postMessage({
          channel: requesterId,
          text: `:white_check_mark: Request sent to <@${targetUserId}>!`,
        });
      } catch (e) {
        console.error("Failed to send DM", e);
        await client.chat.postMessage({
          channel: requesterId,
          text: ":x: Failed to send request to the channel owner.",
        });
      }
    });

    // --- Action Handlers for Approval Flow ---
    app.action("approve_join", async ({ body, action, ack, client }) => {
      await ack();
      if (body.type !== "block_actions" || !("value" in action)) return;

      const blockBody = body as BlockAction;
      const channelIdOfAction = blockBody.channel?.id;

      if (!channelIdOfAction) return;

      try {
        const data = JSON.parse(action.value);
        const { requesterId, channelId } = data;
        const approverId = blockBody.user.id;

        // Invite user
        try {
          await client.conversations.invite({
            channel: channelId,
            users: requesterId,
          });

          // Update DM to show approved
          await client.chat.update({
            channel: channelIdOfAction,
            ts: blockBody.message!.ts,
            text: `✅ Approved request from <@${requesterId}> to join <#${channelId}>.`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `✅ You approved <@${requesterId}>'s request to join <#${channelId}>.`,
                },
              },
            ],
          });

          // Notify requester
          await client.chat.postMessage({
            channel: requesterId,
            text: `🎉 <@${approverId}> approved your request to join <#${channelId}>!`,
          });

          // Log if configured
          const config: JoinConfig = await app.dbs.joinchanneldb.get(channelId);
          if (config?.logChannel) {
            await client.chat
              .postMessage({
                channel: config.logChannel,
                text: `✅ <@${requesterId}> joined <#${channelId}> (Approved by <@${approverId}>).`,
              })
              .catch(() => {});
          }
        } catch (e: any) {
          const errorMsg = e.data?.error || e.message;
          await client.chat.postMessage({
            channel: channelIdOfAction,
            text: `:x: Failed to invite <@${requesterId}>: ${errorMsg}`,
          });
        }
      } catch (e) {
        console.error("Error processing join approval", e);
      }
    });

    app.action("deny_join", async ({ body, action, ack, client }) => {
      await ack();
      if (body.type !== "block_actions" || !("value" in action)) return;

      const blockBody = body as BlockAction;
      const channelIdOfAction = blockBody.channel?.id;

      if (!channelIdOfAction) return;

      try {
        const data = JSON.parse(action.value);
        const { requesterId, channelId } = data;

        // Update DM to show denied
        await client.chat.update({
          channel: channelIdOfAction,
          ts: blockBody.message!.ts,
          text: `🚫 Denied request from <@${requesterId}> to join <#${channelId}>.`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🚫 You denied <@${requesterId}>'s request to join <#${channelId}>.`,
              },
            },
          ],
        });

        // Notify requester (optional, but polite)
        await client.chat.postMessage({
          channel: requesterId,
          text: `🚫 Your request to join <#${channelId}> was denied.`,
        });
      } catch (e) {
        console.error("Error processing join denial", e);
      }
    });

    // --- Command: /join @User ---
    const handleJoin = async ({ command, ack, respond, client }) => {
      await ack();
      const targetUserText = command.text.trim();
      const userMatch = targetUserText.includes("<@")
        ? targetUserText.split("<@")[1].split(">")[0].split("|")[0]
        : targetUserText;

      if (!userMatch) {
        return respond({
          text: ":x: Please specify a user to join their channel. Usage: `/join @User`",
          response_type: "ephemeral",
        });
      }

      const targetUserId = userMatch;

      // Lookup which channel this user owns/linked
      const targetChannelId = await app.dbs.userjoindb.get(targetUserId);

      if (!targetChannelId) {
        return respond({
          text: `:x: <@${targetUserId}> has not linked a channel to their profile yet.`,
          response_type: "ephemeral",
        });
      }

      const config: JoinConfig =
        await app.dbs.joinchanneldb.get(targetChannelId);

      if (!config || !config.enabled) {
        return respond({
          text: ":x: The target channel is not configured to accept joins.",
          response_type: "ephemeral",
        });
      }

      if (config.bannedUsers.includes(command.user_id)) {
        return respond({
          text: ":x: You are banned from joining this channel.",
          response_type: "ephemeral",
        });
      }

      // Check Trust Factor
      if (config.trustRequired) {
        try {
          const today = new Date().toISOString().split("T")[0];
          const trustData = await fetch(
            `https://hackatime.hackclub.com/api/v1/users/${command.user_id}/stats?start_date=${today}&end_date=${today}`,
          ).then((r) => r.json());

          if (trustData.trust_factor?.trust_level === "red") {
            if (!config.bannedUsers.includes(command.user_id)) {
              config.bannedUsers.push(command.user_id);
              await app.dbs.joinchanneldb.set(targetChannelId, config);
            }
            return respond({
              text: ":x: Your trust factor is too low (Red). You have been banned.",
              response_type: "ephemeral",
            });
          }
        } catch (e) {
          console.error("Trust factor check failed", e);
        }
      }

      // Check if questionnaire is required
      if (config.questions && config.questions.length > 0) {
        try {
          await client.views.open({
            trigger_id: command.trigger_id,
            view: {
              type: "modal",
              callback_id: "join_questionnaire",
              private_metadata: JSON.stringify({
                targetUserId,
                targetChannelId,
                requesterId: command.user_id,
              }),
              title: {
                type: "plain_text",
                text: "Join Request",
              },
              submit: {
                type: "plain_text",
                text: "Submit Request",
              },
              blocks: config.questions.map((q, index) => ({
                type: "input",
                block_id: `q_${index}`,
                label: {
                  type: "plain_text",
                  text: q,
                },
                element: {
                  type: "plain_text_input",
                  action_id: `a_${index}`,
                  multiline: true,
                },
              })),
            },
          });
          return; // Stop here, the view submission handler will take over
        } catch (e) {
          console.error("Failed to open modal", e);
          return respond({
            text: ":x: Failed to open questionnaire.",
            response_type: "ephemeral",
          });
        }
      }

      // If no questions, send Approval Request directly to Target User (Owner)
      try {
        await app.client.chat.postMessage({
          channel: targetUserId, // DM the owner
          text: `📢 New Join Request! <@${command.user_id}> wants to join <#${targetChannelId}>.`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `📢 *New Join Request*\n<@${command.user_id}> wants to join your channel <#${targetChannelId}>.`,
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Approve ✅" },
                  style: "primary",
                  action_id: "approve_join",
                  value: JSON.stringify({
                    requesterId: command.user_id,
                    channelId: targetChannelId,
                  }),
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "Deny 🚫" },
                  style: "danger",
                  action_id: "deny_join",
                  value: JSON.stringify({
                    requesterId: command.user_id,
                    channelId: targetChannelId,
                  }),
                },
              ],
            },
          ],
        });

        respond({
          text: `:white_check_mark: Request sent to <@${targetUserId}>.`,
          response_type: "ephemeral",
        });
      } catch (e) {
        console.error("Failed to send DM", e);
        respond({
          text: ":x: Failed to send request to the channel owner. They might need to update their settings.",
          response_type: "ephemeral",
        });
      }
    };

    app.command("/join", handleJoin);
    app.command("/joinchannel", handleJoin);

    // --- Command: /allowjoins ---
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();

      const args = command.text.trim().split(/\s+/);
      const action = args[0]?.toLowerCase();

      // Check channel privacy and creator
      let isPrivate = false;
      let creator = "";
      try {
        const info = await app.client.conversations.info({
          channel: command.channel_id,
        });
        isPrivate = !!info.channel?.is_private;
        creator = info.channel?.creator || "";
      } catch (e) {
        console.error("Failed to fetch channel info", e);
      }

   //   if (!isPrivate) {
//        return respond({
  //        text: ":x: This command is only available for private channels.",
   //       response_type: "ephemeral",
   //     });
     // }

      // Manager Check
      let managers: string[] = [];
      try {
        managers = await getChannelManagers(command.channel_id);
      } catch (e) {}

      if (
        !managers.includes(command.user_id) &&
        command.user_id !== creator &&
        command.user_id !== "U07NKS9S8GZ"
      ) {
        return respond({
          text: ":x: You must be a channel manager or the creator to use this command.",
          response_type: "ephemeral",
        });
      }

      let config: JoinConfig = (await app.dbs.joinchanneldb.get(
        command.channel_id,
      )) || {
        enabled: false,
        bannedUsers: [],
        trustRequired: false,
      };

      // Initialize questions if undefined (backwards compatibility)
      if (!config.questions) config.questions = [];

      switch (action) {
        case "link":
          await app.dbs.userjoindb.set(command.user_id, command.channel_id);
          respond({
            text: `:link: You have linked <#${command.channel_id}> to your account. Users can now join via \`/join <@${command.user_id}>\`.`,
            response_type: "ephemeral",
          });
          break;

        case "enable":
          config.enabled = true;
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          respond({
            text: `:white_check_mark: Joins enabled.`,
            response_type: "ephemeral",
          });
          break;

        case "disable":
          config.enabled = false;
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          respond({
            text: ":no_entry_sign: Joins disabled.",
            response_type: "ephemeral",
          });
          break;

        case "ban":
          const userToBan =
            args[1]?.match(/<@([A-Z0-9]+)\|?.*>/)?.[1] || args[1];
          if (userToBan) {
            if (!config.bannedUsers.includes(userToBan))
              config.bannedUsers.push(userToBan);
            await app.dbs.joinchanneldb.set(command.channel_id, config);
            respond({
              text: `:hammer: Banned <@${userToBan}> from joining.`,
              response_type: "ephemeral",
            });
          } else {
            respond({
              text: "Usage: `/allowjoins ban @user`",
              response_type: "ephemeral",
            });
          }
          break;

        case "unban":
          const userToUnban =
            args[1]?.match(/<@([A-Z0-9]+)\|?.*>/)?.[1] || args[1];
          if (userToUnban) {
            config.bannedUsers = config.bannedUsers.filter(
              (u) => u !== userToUnban,
            );
            await app.dbs.joinchanneldb.set(command.channel_id, config);
            respond({
              text: `:angel: Unbanned <@${userToUnban}>.`,
              response_type: "ephemeral",
            });
          } else {
            respond({
              text: "Usage: `/allowjoins unban @user`",
              response_type: "ephemeral",
            });
          }
          break;

        case "trust":
          const state = args[1]?.toLowerCase();
          if (state === "on" || state === "true") config.trustRequired = true;
          else if (state === "off" || state === "false")
            config.trustRequired = false;
          else
            return respond({
              text: "Usage: `/allowjoins trust on|off`",
              response_type: "ephemeral",
            });
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          respond({
            text: `Trust requirement set to: ${config.trustRequired}`,
            response_type: "ephemeral",
          });
          break;

        case "log":
          const channelMatch = args[1]?.match(/<#(C[A-Z0-9]+)\|?.*>/);
          const channel = channelMatch ? channelMatch[1] : args[1];
          if (channel && channel.startsWith("C")) {
            config.logChannel = channel;
            respond({
              text: `Log channel set to <#${channel}>`,
              response_type: "ephemeral",
            });
          } else {
            delete config.logChannel;
            respond({
              text: `Log channel cleared.`,
              response_type: "ephemeral",
            });
          }
          await app.dbs.joinchanneldb.set(command.channel_id, config);
          break;

        case "questions":
          const qAction = args[1]?.toLowerCase();
          const qText = command.text.split("questions " + qAction)[1]?.trim(); // hacky extraction

          if (qAction === "list") {
            if (config.questions.length === 0) {
              return respond({
                text: "No questions configured.",
                response_type: "ephemeral",
              });
            }
            const list = config.questions
              .map((q, i) => `${i + 1}. ${q}`)
              .join("\n");
            respond({
              text: `*Current Questions:*\n${list}`,
              response_type: "ephemeral",
            });
          } else if (qAction === "add") {
            if (!qText)
              return respond({
                text: "Please provide question text.",
                response_type: "ephemeral",
              });
            if (config.questions.length >= 5)
              return respond({
                text: "Maximum 5 questions allowed.",
                response_type: "ephemeral",
              });

            // Remove quotes if user wrapped in them
            let cleanQ = qText;
            if (
              (cleanQ.startsWith('"') && cleanQ.endsWith('"')) ||
              (cleanQ.startsWith("“") && cleanQ.endsWith("”"))
            ) {
              cleanQ = cleanQ.slice(1, -1);
            }

            config.questions.push(cleanQ);
            await app.dbs.joinchanneldb.set(command.channel_id, config);
            respond({
              text: `Added question: "${cleanQ}"`,
              response_type: "ephemeral",
            });
          } else if (qAction === "clear") {
            config.questions = [];
            await app.dbs.joinchanneldb.set(command.channel_id, config);
            respond({
              text: "Cleared all questions.",
              response_type: "ephemeral",
            });
          } else {
            respond({
              text: "Usage: `/allowjoins questions [list|add <text>|clear]`",
              response_type: "ephemeral",
            });
          }
          break;

        case "status":
        default:
          const qCount = config.questions?.length || 0;
          respond({
            text: `*Join Configuration for <#${command.channel_id}>*\nEnabled: \`${config.enabled}\`\nTrust Required: \`${config.trustRequired}\`\nQuestions: ${qCount}\nBanned Users: ${config.bannedUsers.length}\nLog Channel: ${config.logChannel ? `<#${config.logChannel}>` : "None"}\n\nUsage: \`/allowjoins [link|enable|disable|ban|unban|trust|log|questions]\``,
            response_type: "ephemeral",
          });
          break;
      }
    });
  }
}
