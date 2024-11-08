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
    app.client.chat.postMessage({
      channel,
      text: `${realData.status == "blocked" ? ":x:" : ":white_check_mark:"} ${realData.encrypted ? ":lock: " : ""} - ${realData.domain} `,
    });
  };
  // fetch(`https://api.nextdns.io/profiles/${id}/logs/stream`, {
  //   headers: { "X-Api-Key": process.env.NEXTDNS_API_KEY },
  // }).then((r) => {
  //   const reader = r.body?.getReader();
  //   const rs = require("stream").Readable();
  //   rs._read = async () => {
  //     const result = await reader?.read();
  //     if (!result?.done) {
  //       //@ts-ignore
  //       rs.push(Buffer.from(result.value));
  //     } else {
  //       rs.push(null);
  //       return;
  //     }
  //   };
  //   //@ts-ignore
  //   rs.on("data", (d) => {
  //     const str = d.toString();
  //     if (str.includes(":keepalive")) return;
  //     console.debug(str);
  //     try {
  //       let splits = str.split("\n");
  //       let id = splits[0].split(/ +/)[1];
  //       let data = splits[1].split(":").slice(1).join(":");
  //       if (!id || !data) return;
  //       const realData: Root = JSON.parse(data);
  //       console.log(realData);
  //       //@ts-ignore
  //       delete realData.clientIp;
  //       //   console.log(`${realData.status == 'blocked' ? ':x:' : ":white_check_mark:"} ${realData.encrypted ? ":lock: " : ""} - ${realData.domain} `)
  //       app.client.chat.postMessage({
  //         channel,
  //         text: `${realData.status == "blocked" ? ":x:" : ":white_check_mark:"} ${realData.encrypted ? ":lock: " : ""} - ${realData.domain} `,
  //       });
  //     } catch (e) { }
  //   });
  //   rs.on("end", () => {
  //     console.log("end");
  //     // restart
  //     PrivateDNS(app, id, channel);
  //   });
  // });
}
