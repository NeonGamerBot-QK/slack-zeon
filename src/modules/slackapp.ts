// const { App } = require('@slack/bolt');

import { App } from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";
import JSONdb from "simple-json-db";
import { handleGitRequest } from "./projectWaterydo";
import { bdayutils } from "./index";
import { Api } from "nocodb-sdk";
import KeyvSqlite from "@keyv/sqlite";
// import { ChartJSNodeCanvas } from "chartjs-node-canvas";

import RSS from "rss";
import { Update } from "./journey";
import { generateGraph, generateGraph12h } from "./shipwrecked";
import Keyv from "keyv";
import { LogSnag } from "@logsnag/node";
export interface ModifiedApp extends App<StringIndexed> {
  db: JSONdb;
  dbs: {
    [k: string]: JSONdb | Keyv;
  };
  kdbs: {
    [k: string]: Keyv;
  };
  nocodb: Api<any>;
  is_at_school: boolean;
  disable_wmi: boolean;
  ws: null | any;
  utils: typeof import("./index");
  logsnag: LogSnag
}
export function buildHtml() {
  // oh yes im writing a whole ass website in ts file with no jsx
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zeon slack </title>
  <meta name="description" content="Zeon slack">
  <meta name="author" content="NeonGamerBot-QK">

  <style>
  :root {
    --rosewater: #f5e0dc;
    --flamingo: #f2cdcd;
    --pink: #f5c2e7;
    --mauve: #cba6f7;
    --red: #f38ba8;
    --maroon: #eba0ac;
    --peach: #fab387;
    --yellow: #f9e2af;
    --green: #a6e3a1;
    --teal: #94e2d5;
    --sky: #89dceb;
    --sapphire: #74c7ec;
    --blue: #89b4fa;
    --lavender: #b4befe;
    --text: #cdd6f4;
    --subtext1: #bac2de;
    --subtext0: #a6adc8;
    --overlay2: #9399b2;
    --overlay1: #7f849c;
    --overlay0: #6c7086;
    --surface2: #585b70;
    --surface1: #45475a;
    --surface0: #313244;
    --base: #1e1e2e;
    --mantle: #181825;
    --crust: #11111b;
    }
  body,html {
    color: var(--text);
    background-color: var(--mantle);
  }
  a {
  color: var(--mauve);
  font-weight: bold;
  }
  .box {
    color: var(--text);
    border-radius: 0.5rem;
    padding: 2px
  }  
  </style>
</head>
<body>
<div class="box">
<main><center>
<h1> Zeon's site </h1>
<p>wip, todo</p>
</main></center>
</div>
</html>
`;
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
        // res.setHeader(`Location`, `https://saahild.com`);
        // res.writeHead(302);
        // res.end(`bye`);
        const site = buildHtml();
        res.writeHead(200).end(site);
      },
    },
    {
      path: "/project-feed-journey.xml",
      method: ["GET"],
      async handler(req, res) {
        // get ID query
        const query = new URLSearchParams(req.url.split("?")[1]);
        const id = query.get("id");
        if (!id) return res.writeHead(400).end(`I cant find that project`);
        //@ts-ignore
        const entry = app.dbs.journey.get(id);
        if (!entry)
          return res.writeHead(400).end(`I cant find that project - db`);
        const rss = new RSS({
          title: `Journey for ${id}`,
          site_url: `https://journey.hackclub.com/projects/${id}`,
          feed_url: `https://slack.mybot.saahild.com/project-feed-journey.xml?id=${id}`,
          description: `Journey for ${id}`,
        });
        const updates = entry.updates;
        for (const m of updates) {
          const meta = m.meta as Update;
          rss.item({
            title: `Update for ${new Date(meta.created_at).toLocaleDateString()}`,
            description: meta.text,
            link: `https://journey.hackclub.com/projects/${id}`,
            guid: m.ts,
            author: meta.slack_id,
            enclosure: meta.attachment
              ? {
                  url: meta.attachment,
                  type: "image/png",
                }
              : undefined,
            date: new Date(m.meta.created_at),
          });
        }
        res
          .writeHead(200, {
            "Content-Type": "text/xml",
          })
          .end(rss.xml({ indent: true }));
      },
    },
    {
      path: "/happenings.xml",
      method: ["GET"],
      async handler(req, res) {
        async function getAllMessages(channelId) {
          let messages = [];
          let cursor;

          try {
            do {
              const response = await app.client.conversations.history({
                channel: channelId,
                limit: 200,
                cursor: cursor,
              });

              messages = messages.concat(response.messages);
              cursor = response.response_metadata?.next_cursor;
            } while (cursor);

            return messages;
          } catch (error) {
            console.error("Error fetching messages:", error);
            return [];
          }
        }
        const rss = new RSS({
          title: `Happenings!`,
          site_url: `https://app.slack.com/client/T0266FRGM/C05B6DBN802`,
          feed_url: `https://slack.mybot.saahild.com/happenings.xml`,
          description: `Happenings!`,
        });
        for (const m of (await getAllMessages("C05B6DBN802")).slice(
          0,
          Math.random() > 0.5 ? 3 : 5,
        )) {
          rss.item({
            title: `Post for ${new Date(m.ts * 1000).toLocaleDateString()}`,
            description: m.text,
            date: new Date(m.ts * 1000),
          });
        }
        res
          .writeHead(200, {
            "Content-Type": "text/xml",
          })
          .end(rss.xml({ indent: true }));
        // res.writeHead(200).end(site);
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
        res.writeHead(200).end(await bdayutils.renderBday(user, app));
      },
    },
    {
      path: "/api/keys",
      method: ["GET"],
      async handler(req, res) {
        const authHeader = req.headers["authorization"];
        if (authHeader !== process.env.AUTH_FOR_AITHINGY) {
          res.writeHead(401).end();
          return;
        }
        //@ts-ignore
        res.writeHead(200).end(JSON.stringify(app.db.get(`ai_keys`)));
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
