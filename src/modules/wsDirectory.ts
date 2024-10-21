import WebSocket from 'ws';
import { ModifiedApp } from './slackapp';
export const tempCache = []
export function startWatchingDirectory(app: ModifiedApp) {
    const wss = new WebSocket(`wss://l.hack.club`)
    wss.on('open', () => {
        console.log('connected to wss://l.hack.club')
    })
    wss.on('message', async (data) => {
        const d = JSON.parse(data.toString())
        console.debug(d.channel,`C07ST3FF4S0`, d.ts)
        const uniqueId = Buffer.from(d.ts+d.channel).toString('base64')
        if(tempCache.includes(uniqueId)) {
            console.log(`Already processed ${uniqueId}`)
            return
        }
        if(d.channel == "C07ST3FF4S0") return;
        tempCache.push(uniqueId)
         console.log(d);
        //console.log(d)
const messageLink = await app.client.chat.getPermalink({
    channel: d.channel,
    message_ts: d.ts,
}).then(d=>d.permalink)
await app.client.chat.postMessage({
text: messageLink,
channel: `C07ST3FF4S0`
})
})
    wss.on('close', () => {
        console.log(`Closing connection`)
    })
}