require("dotenv").config();
const StegCloak = require("stegcloak");
const fs = require("fs");
const path = require("path");
const stegcloak = new StegCloak(true, false);

function decrypt(str) {
  return stegcloak.reveal(str, process.env.CTF_PASSWORD);
}
const files = fs.readdirSync(path.join(__dirname, "notes"));
files.forEach((file, i) => {
  console.log(`Decrypting ${file}`);
  const data = fs.readFileSync(path.join(__dirname, "notes", file)).toString();
  console.log(JSON.parse(decrypt(data)));
  if (i == files.length - 1) {
    console.log("Done!");
    setTimeout(() => {
      process.exit(0);
    }, 150);
  }
});
