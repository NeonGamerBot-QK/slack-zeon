import path from "path";
import { ModifiedApp } from "./slackapp";
import { writeFileSync } from "fs";
import { Cron } from "croner";
interface Moment {
  id: string;
  description: string;
  email?: string;
  kudos: number;
  created_at: string;
  video: string;
}
export function getKudosMoments() {
  return fetch("https://juice.hackclub.com/api/get-omg-moments").then(
    (r) => r.json() as Promise<Moment[]>,
  ).then(r=>[...new Set(r)] as Moment[]);
}

export async function cron(app: ModifiedApp) {
  const moments = await getKudosMoments();
  // console.log(moments)
  // query via nocodb to get current records ig
  // const records = await app.nocodb.dbViewRow
  const records = await app.nocodb.dbViewRow
    .list("noco", "p63yjsdax7yacy4", "mx0auhbm95uv2xe", "vwkxqq24oc49spbq", {
      offset: 0,
      where: "",
      //@ts-ignore
      limit: 1000,
    })
    .then(
      (e) =>
       ([...new Set((e.list as {
          airtable_id: string;
          // there is other stuff but we dont need it
        }[]).map(e=>e.airtable_id.trim()))])
    );
  for (const moment of moments) {
    const isPresent = records.includes(moment.id.trim());
    if (isPresent) continue;
    // insert into db
    await app.nocodb.dbViewRow.create(
      `noco`,
      "p63yjsdax7yacy4",
      "mx0auhbm95uv2xe",
      "vwkxqq24oc49spbq",
      {
        airtable_id: moment.id,
        description: moment.description,
        video_url: moment.video,
        airtable_created_at: moment.created_at,
        kudos: moment.kudos,
      },
    );
    // send message to slack

    // stream the video (this is such a bad idea1)
    // download video to tmp.mp4
    await fetch(moment.video)
      .then((r) => r.arrayBuffer())
      .then(Buffer.from)
      .then((d) => {
        writeFileSync(path.join(__dirname, "..", "tmp.mp4"), d);
      });
    const video = path.join(__dirname, "..", "tmp.mp4");
    await app.client.files.uploadV2({
      file: video,
      filename: `kudos.mp4`,
      channel_id: `C07LGLUTNH2`,
      alt_text: `users kudos video `,
      initial_comment: `:juice: ${moment.description} -- Earned *${moment.kudos}* :juice-kudos:`,
      // title: `:d20: You rolled a *${roll}* and the video is here:`,
      // initial_comment: `:d20: You rolled a *${roll}* and the video is here:`,
    });
  }
  console.log(`#juicedone`)
}
export function setupCron(app: ModifiedApp) {
  new Cron("*/15 * * * *", async () => {
    // cron(app);
  });
}
