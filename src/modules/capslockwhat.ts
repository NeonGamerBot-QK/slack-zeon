// ws moment
import WebsocketClient from "ws"
import { ModifiedApp } from "./slackapp";
export default function watchWS(app: ModifiedApp) {
    const ws = new WebsocketClient("wss://globalcapslock.com/ws")
const cb = (message: string) => app.client.chat.postMessage({
    text: message,
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