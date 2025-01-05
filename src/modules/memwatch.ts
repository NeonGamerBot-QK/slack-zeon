//@ts-ignore
import memwatch from "memwatch-next";
import { ModifiedApp } from "./slackapp";
export default function watchMem(app: ModifiedApp) {
  memwatch.on("leak", (info) => {
    app.client.chat.postMessage({
      text: `:x: my memory is leaking plz kill me :3\n\`\`\`\n${JSON.stringify(info, null, 2)}\n\`\`\``,
      channel: `C07LGLUTNH2`,
    });
  });
  memwatch.on("stats", function (stats) {
    app.client.chat.postMessage({
      text: `debug: mem stats ;3 \n\`\`\`\n${JSON.stringify(stats, null, 2)}\n\`\`\``,
      channel: `C07LGLUTNH2`,
    });
  });
}
