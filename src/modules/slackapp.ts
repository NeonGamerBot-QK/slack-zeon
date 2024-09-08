// const { App } = require('@slack/bolt');

import { App } from "@slack/bolt"
// Initializes your app with your bot token and signing secret
export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  customRoutes: [{
    path: '/',
    method: ["GET"],
    handler(req, res) {
        res.setHeader(`Location`, `https://saahild.com`)
        res.writeHead(302)
        res.end(`bye`)
    },
  }]
});
export default app;
