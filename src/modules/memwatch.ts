//@ts-ignore
import memwatch from "node-memwatch-new";
import { ModifiedApp } from "./slackapp";
export default function watchMem(app: ModifiedApp) {
  memwatch.on("leak", (info) => {
    app.client.chat.postMessage({
      text: `:x: my memory is leaking plz kill me :3\n\`\`\`\n${JSON.stringify(info, null, 2)}\n\`\`\``,
      channel: `C07LGLUTNH2`,
    });
  });
  memwatch.on("stats", async function (stats) {
    // app.client.chat.postMessage({
    //   text: `debug: mem stats ;3 \n\`\`\`\n${JSON.stringify(stats, null, 2)}\n\`\`\``,
    //   channel: `C07LGLUTNH2`,
    // });
    // save in db for graph ;p
    // const old = await app.dbs.memdebug.get(`memwatch`) || [];
    // old.push(stats);
    // if (old.length > 100) old.shift();
    // app.dbs.memdebug.set(`memwatch`, old);
    await app.dbs.memdebug.set(new Date().toISOString(), stats);
  });
}
