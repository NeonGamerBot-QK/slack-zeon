import "dotenv/config";
import "./modules/watch-git";
// import "./modules/smee"
import app from "./modules/slackapp";

app.start(process.env.PORT || 3000).then((d) => {
  console.log(`App is UP (please help)`);
});
// this is temp i swear
app.command("/ping", async ({ command, ack, respond }) => {
  const stamp = Date.now();
  await ack();
  respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
    console.log(d);
  });
});
// Listen for users opening your App Home
app.event("app_home_opened", async ({ event, client, logger }) => {
  try {
    // Call views.publish with the built-in client
    const result = await client.views.publish({
      // Use the user ID associated with the event
      user_id: event.user,
      view: {
        // Home tabs must be enabled in your app configuration page under "App Home"
        type: "home",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Welcome home, <@" + event.user + "> :house:*",
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Learn how home tabs can be more useful and interactive <https://api.slack.com/surfaces/tabs/using|*in the documentation*>.",
            },
          },
        ],
      },
    });

    logger.info(result);
  } catch (error) {
    logger.error(error);
  }
});
