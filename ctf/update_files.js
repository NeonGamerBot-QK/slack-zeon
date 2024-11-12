require("dotenv").config();
const StegCloak = require("stegcloak");
const fs = require("fs");
const path = require("path");
function getCloakChunk(s = 2, e = 4) {
  return Buffer.alloc(256)
    .fill(eval(`0x${Math.random().toString().split(".")[1].slice(s, e)}`))
    .toString("base64");
}
function getCloak() {
  return [
    getCloakChunk(),
    getCloakChunk(3, 5),
    getCloakChunk(1, 2),
    getCloakChunk(),
  ].join(" ");
}
const stegcloak = new StegCloak(true, false);
function encrypt(str) {
  return stegcloak.hide(str, process.env.CTF_PASSWORD, getCloak());
}
function decrypt(str) {
  return stegcloak.reveal(str, process.env.CTF_PASSWORD);
}
require("child_process").execSync("rm -rf notes && mkdir notes", {
  pwd: __dirname,
});
const files = fs.readdirSync(path.join(__dirname, "unenc"));
files.forEach((file, i) => {
  console.log(`Encrypting ${file}`);
  const data = fs.readFileSync(path.join(__dirname, "unenc", file)).toString();
  fs.writeFileSync(path.join(__dirname, "notes", file), encrypt(data));
  if (i == files.length - 1) {
    console.log("Done!");
    setTimeout(() => {
      process.exit(0);
    }, 150);
  }
});
