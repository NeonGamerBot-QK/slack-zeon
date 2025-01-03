import { ModifiedApp } from "./slackapp";
import EventSource from "eventsource";
export interface Root {
  timestamp: string;
  domain?: string;
  root: string;
  encrypted: boolean;
  protocol: string;
  clientIp?: string;
  device: Device;
  status: string;
  reasons: Reason[];
}

export interface Reason {
  id: string;
  name: string;
}
export interface Device {
  id: string;
  name: string;
}
export let chunks: string[] = [];
export function PrivateDNS(app: ModifiedApp, id: string, channel: string) {
  const client = new EventSource(
    `https://api.nextdns.io/profiles/${id}/logs/stream`,
    {
      headers: { "X-Api-Key": process.env.NEXTDNS_API_KEY },
    },
  );
  client.onmessage = (message) => {
    const realData: Root = JSON.parse(message.data);
    // console.log(realData);
    //@ts-ignore
    delete realData.clientIp;
    //   console.log(`${realData.status == 'blocked' ? ':x:' : ":white_check_mark:"} ${realData.encrypted ? ":lock: " : ""} - ${realData.domain} `)
    if (chunks.length < 10) {
      chunks.push(
        `${realData.status == "blocked" ? ":x:" : ":white_check_mark:"} ${realData.encrypted ? ":lock: " : ""} - ${realData.domain} `,
      );
    } else {
      app.client.chat.postMessage({
        channel,
        text: chunks.join("\n"),
      });
      chunks = [];
    }
  };
}
