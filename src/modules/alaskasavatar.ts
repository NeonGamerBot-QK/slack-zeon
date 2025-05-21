import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Cron } from "croner";
// import { writeFileSync } from "fs";
// const { createCanvas, loadImage } = require('@napi-rs/canvas')
export function sendImage(imageData) {
  fetch("https://alaska-avatar.vercel.app/api/upload", {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "image/png",
      origin: "https://alaska-avatar.vercel.app",
      priority: "u=1, i",
      referer: "https://alaska-avatar.vercel.app/",
      "sec-ch-ua": '"Chromium";v="133", "Not(A:Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      cookie: "token=" + process.env.ALASKAS_AVATAR_KEY,
    },
    body: imageData,
  })
    .then((d) => d.json())
    .then(console.log);
}

const canvas = createCanvas(300, 320);
const ctx = canvas.getContext("2d");
export async function idkRunAvatarThingy() {
  const zeon = await loadImage(
    "https://saahild.com/zeon/static/media/logo.496b486aab466e923154.png",
  );
  const avatar = await loadImage("https://alaska-avatar.vercel.app/api/avatar");
  const scale = 0.5;
  const imgWidth = zeon.width * scale;
  const imgHeight = zeon.height * scale;
  const margin = 9;

  // Draw background image to fill the entire canvas
  ctx.drawImage(avatar, 0, 0, 300, 320);
  // Draw image in top-right
  const x = 300 - imgWidth - margin;
  const y = margin;
  ctx.drawImage(zeon, x, y, imgWidth, imgHeight);
  // Save to file
  const buffer = canvas.toBuffer("image/png");
  // const blob = canvas.t
  // writeFileSync('output.png', buffer);
  console.log(`Sending...`);
  sendImage(buffer);
}
export function cronJobForAvatar() {
  new Cron("0 */3 * * *", async () => {
    await idkRunAvatarThingy();
  });
}
