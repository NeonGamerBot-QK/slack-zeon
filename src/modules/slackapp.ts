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
      path: "/send-private",
      method: ["POST"],
      async handler(req, res) {
        const authHeader = req.headers["authorization"];
        if (authHeader !== process.env.AUTH) {
          res.writeHead(401).end();
          return;
        }
        // pray this works
        console.log(
          require("body-parser").json()(req, res, async () => {
            //@ts-ignore
            console.log(req.body, 1);

            //@ts-ignore
            if (!req.body || Object.keys(req.body) == 0) {
              res.writeHead(400).end();
              return;
            }
            try {
              await app.client.chat.postMessage({
                channel: "C07LT7XS28Z",
                //@ts-ignore
                ...req.body,
              });
              res.writeHead(200);
              res.end();
            } catch (e: any) {
              res.writeHead(500);
              res.end(e.stack);
            }
          }),
        );
      },
    },
  ],
});
export default app;
