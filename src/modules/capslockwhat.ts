// ws moment
import WebsocketClient from "ws"
import { ModifiedApp } from "./slackapp";
export default function watchWS(app: ModifiedApp) {
    const ws = new WebsocketClient("wss://globalcapslock.com/ws")
    let msgsArray = []
const cb = (message: string) => msgsArray.length < 4 ? msgsArray.push(message) : app.client.chat.postMessage({
    text: msgsArray.join("\n"),
    channel: "C08CQ8CMR5K"
})
let lastSwitch = -1;
ws.on('message', d => {
const switc:number = parseFloat(d.toString())
if(switc == lastSwitch) return;
cb(`Switched from \`${lastSwitch}\` -> \`${switc}\``)
lastSwitch = switc
})
}