import "dotenv/config"
import "./modules/watch-git"
// import "./modules/smee"
import app from './modules/slackapp'
import { View } from "@slack/bolt"
import Loader from "./modules/CommandLoader"
import path from "path"
app.start(process.env.PORT || 3000).then((d) => {
    console.log(`App is UP (please help)`)
})
const cmdLoader = new Loader(app, path.join(__dirname, 'commands'))
// this is temp i swear
cmdLoader.runQuery()

// app.command('/ping',async ({ command, ack, respond }) => {
//     const stamp = Date.now()
//     await ack()
//  respond(`Pong took: \`${Date.now() - stamp}ms\``).then(d => {
//  })
// })
// Listen for users opening your App Home
app.event('app_home_opened', async ({ event, client, logger }) => {
    try {
      console.log(`USER: ${event.user}`)
      function genView():View {
      if(process.env.MY_USER_ID !== event.user)  return {
          // Home tabs must be enabled in your app configuration page under "App Home"
          type: "home",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Not for you <@" + event.user + "> :x: *"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Nothing on the home page for you :P."
              }
            }
          ]
        }
        return {
          // Home tabs must be enabled in your app configuration page under "App Home"
          type: "home",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Welcome home, <@" + event.user + "> :house:*"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Learn how home tabs can be more useful and interactive <https://api.slack.com/surfaces/tabs/using|*in the documentation*>."
              }
            }
          ]
        }
      }
      // Call views.publish with the built-in client
      const result = await client.views.publish({
        // Use the user ID associated with the event
        user_id: event.user,
        view: genView()
      });
  
      // logger.info(result);
    }
    catch (error) {
      logger.error(error);
    }
  });