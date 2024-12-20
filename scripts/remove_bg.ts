// convert video to frames
// remove bg from frames
// compile frames into video
// must have ffmpeg installed

import canvas from "canvas";
import { execSync } from "child_process";
const { createCanvas, loadImage } = canvas
import fs, { existsSync, readdirSync } from "fs"
// rmrif frames and remake
execSync(`rm -rf assets/dice/frames`, { stdio: 'inherit' })
execSync(`mkdir assets/dice/frames`, { stdio: 'inherit' })
if(!process.env.VIDEO_FILE) process.env.VIDEO_FILE=`assets/dice/green_screen_dice.mp4`
if(!process.env.OUT_FILE) process.env.OUT_FILE=`assets/dice/no_green_screen_dice.mp4`
const removeGreenScreen = async (inputPath, outputPath) => {
  const image = await loadImage(inputPath);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0, image.width, image.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    if (green > 150 && red < 100 && blue < 100) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log(`Green screen removed and saved to ${outputPath}`);
};
execSync(`ffmpeg -i ${process.env.VIDEO_FILE} assets/dice/frames/frame_%04d.png`, { stdio: 'inherit' })
// Usage
let frames = readdirSync("assets/dice/frames");
;(async () => {
    for(const frame of frames){
       if(!existsSync(`assets/dice/frames/cleaned_${frame}`)){
        await removeGreenScreen(`assets/dice/frames/${frame}`, `assets/dice/frames/cleaned_${frame}`)
       } else {
        console.log(`Skipping ${frame}`)
       }
    }
    console.log(`Compiling frames into video`)
    execSync(`ffmpeg -framerate 30 -i assets/dice/frames/cleaned_frame_%04d.png -c:v libx264 -pix_fmt yuva420p ${process.env.OUT_FILE}`, { stdio: 'inherit' })
    console.log(`Done`)
})()