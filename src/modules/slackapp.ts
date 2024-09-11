// const { App } = require('@slack/bolt');

import { App } from "@slack/bolt";
// Initializes your app with your bot token and signing secret
export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      path: "/",
      method: ["GET"],
      handler(req, res) {
        res.setHeader(`Location`, `https://saahild.com`);
        res.writeHead(302);
        res.end(`bye`);
      },
    },
    {
      path: "/",
      method: ["POST"],
      handler(req, res) {
        const authHeader = req.headers["authorization"];
        if (authHeader !== process.env.AUTH) {
          res.writeHead(401).end();
          return;
        }
        // pray this works
        console.log(
          require("body-parser").json()(req, res, () => {
            //@ts-ignore
            console.log(req.body, 1);
          }),
        );
        //@ts-ignore
        console.log(`req.body`, req.body);
        app.client.chat.postMessage({
          channel: "C07LT7XS28Z",
          text: "todo",
        });
        res.writeHead(200);
        res.end();
      },
    },
  ],
});
export default app;
