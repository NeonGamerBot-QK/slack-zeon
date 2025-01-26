import { ModifiedApp } from "./slackapp";
interface Schedule {
  day: string;
  date: string;
  startHour: string;
  endHour: string;
  comment?: string;
}
const regexForTime = /[A-Za-z0-9]+ \([^)]*\)(:|-) [A-Za-z0-9]+ - [A-Za-z0-9]+/i;
function extractText(t: string): Schedule[] {
  // find where the list begins
  let splits: any[] = t.split("\n");
  splits = splits
    .slice(splits.findIndex((x) => x.includes("schedule")) + 1)
    .filter(Boolean);
  // console.log(regexForTime.test(splits[4]), splits[4])

  // console.debug(0, splits)
  // console.log(splits.length, splits.findIndex(e => !regexForTime.test(e)))
  splits = splits.filter(Boolean).slice(
    0,
    splits.findIndex((e) => !regexForTime.test(e)),
  );
  // console.debug(1, splits)
  splits = splits.map((e) =>
    e
      .split(/ +/)
      .map((f) => {
        if (f == "-") return null;
        if (f.includes("/")) return f.replaceAll(/\(|\)|:/g, "");
        return f;
      })
      .filter(Boolean),
  );
  const final = splits.map((split1) => {
    return [...split1.slice(0, 4), split1.slice(4).join(" ")].filter(Boolean);
  });
  //.map(e => e.match(regexForTime));
  console.log(splits);
  return final.map((splits) => ({
    day: splits[0],
    date: splits[1].replace(`-`, ``),
    startHour: splits[2],
    endHour: splits[3],
    comment: splits[4],
  }));
}

export async function sendSchedule(
  text: string,
  app: ModifiedApp,
  channel: string,
) {
  const schedule = extractText(text);
  if (schedule.length == 0) return;
  const msg = await app.client.chat.postMessage({
    channel,
    text: `Oh whats this? a schedule? for .. Robotics?? :robot:`,
  });
  for (const s of schedule) {
    await app.client.chat.postMessage({
      channel: msg.channel,
      text: `Oh you have Robotics on *${s.day}* at *${s.startHour}* to *${s.endHour}* \n> ${s.comment ?? "No comment"}`,
      thread_ts: msg.ts,
    });
    await new Promise((r) => setTimeout(r, 100));
  }
}
