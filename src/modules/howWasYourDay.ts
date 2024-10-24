// how was your day reader?
// anyways

import JSONdb from "simple-json-db";
import { ModifiedApp } from "./slackapp";

export function getDayResponse(db: JSONdb) {
  const lastMessageLink =
    db.get("howday_last_message_link") ||
    "Wow this is the first one or i have not finished the code.";
  return `Well well <@${process.env.MY_USER_ID}> <${lastMessageLink}|how was your day>. either way heres some stuff about today.\n> Your hw:\nTodo.\n> your todo list you want to share here\n> also todo `;
}
// @see https://stackoverflow.com/a/43837711
// export function makeSlackMessageUrl(channel: string, messageTs: number) {
//     const int=messageTs.toString().split('.')[0]
//     return `https://hackclub.slack.com/archives/${channel}/p${int}`
// }
/**
 *
 * @param app
 * @param filter
 * @deprecated
 */
export function listenForResponse(app: ModifiedApp, filter: any) {
  async function messageListener(message) {
    if (filter(message)) {
      const link = await app.client.chat
        .getPermalink({
          message_ts: message.event.ts,
          channel: message.event.channel,
        })
        .then((d) => d.permalink);
      app.db.set("howday_last_message_link", link);
      app.client.reactions.add({
        channel: message.event.channel,
        timestamp: message.event.ts,
        name: "thumbsup",
      });
    }
  }
  // TODO: find a way to stop the event after xyz time
  app.event("message", messageListener);
}
export default async function (app: ModifiedApp) {
  const db = app.db;
  const getStr = await getDayResponse(db);
  app.client.chat.postMessage({
    channel: `C07R8DYAZMM`,
    text: getStr,
  });
}
