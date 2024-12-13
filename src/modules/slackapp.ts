// const { App } = require('@slack/bolt');

import { App } from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";
import JSONdb from "simple-json-db";
import { handleGitRequest } from "./projectWaterydo";
export interface ModifiedApp extends App<StringIndexed> {
  db: JSONdb;
  dbs: {
    [k: string]: JSONdb;
  };
  is_at_school: boolean;
  ws: null | any;
  utils: typeof import("./index");
}
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
      path: "/bday",
      method: ["GET"],
      async handler(req, res) {
        const query = new URLSearchParams(req.url.split("?")[1]);
        const user = query.get("u");
        console.log(user);
        if (!user) return res.writeHead(400).end(`I cant find that user`);
        //@ts-ignore
        res.writeHead(200).end(`Happy bday!! (this is a WIP)`);
      },
    },
    {
      path: "/health",
      method: ["GET"],
      async handler(req, res) {
        res.writeHead(200).end(`OK`);
      },
    },
    {
      path: "/send-private",
      method: ["POST"],
      async handler(req, res) {
        await new Promise((resolve) => {
          require("cors")({ origin: "*" })(req, res, resolve);
        });
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
            //@ts-ignore
            if (req.body.token === "my-user-token")
              //@ts-ignore
              req.body.token = process.env.MY_SLACK_TOKEN;
            try {
              await app.client.chat
                .postMessage({
                  channel: "C07LT7XS28Z",
                  //@ts-ignore
                  ...req.body,
                })
                .then((d) => {
                  res.writeHead(200);
                  res.end(JSON.stringify(d));
                });
            } catch (e: any) {
              res.writeHead(500);
              res.end(e.stack);
            }
          }),
        );
      },
    },
    {
      path: "/github-cb-for-slack",
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
            //@ts-ignore
            handleGitRequest(req.body, app);
            res.writeHead(200).end();
          }),
        );
      },
    },
    {
      path: "/send-spotify",
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
              await app.client.chat
                .postMessage({
                  channel: "C07RE4N7S4B",
                  //@ts-expect-error
                  text: `:new_spotify: New Song: ${req.body.songurl} - added by <@${req.body.user}>`,
                })
                .then((d) => {
                  app.client.chat
                    .postMessage({
                      channel: "C07RE4N7S4B",
                      thread_ts: d.ts,
                      text: `:thread: Responses about new song here please!`,
                    })
                    .then(async () => {
                      // try to invite user
                      try {
                        await app.client.conversations.invite({
                          channel: "C07RE4N7S4B",
                          //@ts-ignore
                          users: req.body.user,
                        });
                      } catch (e) {
                        console.error(`Failed to invite user.`);
                      }
                      //@ts-ignore
                      if (!req.body.noping) {
                        app.client.chat.postMessage({
                          channel: "C07RE4N7S4B",
                          text: `<!subteam^S07RGTY93J8>`,
                        });
                      }
                      res.writeHead(200);
                      res.end(JSON.stringify(d));
                    });
                });
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
export default app as ModifiedApp;
