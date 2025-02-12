// ws moment
import WebsocketClient from "ws";
import { ModifiedApp } from "./slackapp";
export default function watchWS(app: ModifiedApp) {
  const ws = new WebsocketClient("wss://globalcapslock.com/ws");
  let msgsArray = [];
  const cb = (message: string) =>
    msgsArray.length < 10
      ? msgsArray.push(message)
      : app.client.chat.postMessage({
          text: msgsArray.join("\n"),
          channel: "C08CQ8CMR5K",
        });
  let lastSwitch = -1;
  ws.on("message", async (d) => {
    await new Promise((r) => setTimeout(r, 1000));
    const switc: number = parseFloat(d.toString());
    if (switc == lastSwitch) return;
    if (msgsArray.length > 8) msgsArray = [];
    cb(`Switched from \`${lastSwitch}\` -> \`${switc}\``);
    lastSwitch = switc;
  });
}
