import { exec } from "child_process";
import { readFileSync } from "fs";
export default function (app: any) {
  const timer = setInterval(() => {
    const bcommitMessage = require("child_process")
    .execSync("git log -1 --pretty=%B")
    .toString();
    const bhash = readFileSync(".git/refs/heads/master").toString();
    exec(`git pull`, (error, stdout) => {
      let response = error?.stdout ? error?.stdout[0].toString() : stdout;
      if (!error) {
        if (!response?.includes("Already up to date.")) {
          const commitMessage = require("child_process")
            .execSync("git log -1 --pretty=%B")
            .toString();
            const hash = 
            readFileSync(".git/refs/heads/master")
            .toString()
            .split("\n")[0];
            const compareStr =
            response.split("Updating ")[1].split("\n")[0].trim() ||
            `${bhash}...${hash}`;
          console.log(`New git stuff wowie`);
          console.log(response);
          const cap = (str, length) => {
            if (str == null || str?.length <= length) return str;

            return str.substr(0, length) + "**\u2026**";
          };
          const text = `\`${new Date().toISOString()}\` Automatic update from GitHub, pulling files. <https://github.com/NeonGamerBot-QK/slack-zeon/compare/${compareStr}|\`${compareStr}\`>\n\`\`\`${cap(
            response,
            1700
          )}\`\`\`\n## Current Branch \n<https://github.com/NeonGamerBot-QK/slack-zeon/commit/${bhash}|\`View Changes\`>     <https://github.com/NeonGamerBot-QK/slack-zeon/tree/${bhash}|\`Branch\`>       **Commit Message**: \`${bcommitMessage.replace(
            "\n",
            ""
          )}\`\n## Latest Branch\n## Current Branch \n<https://github.com/NeonGamerBot-QK/slack-zeon/commit/${hash}|\`View Changes\`>     <https://github.com/NeonGamerBot-QK/slack-zeon/tree/${hash}|\`Branch\`>       **Commit Message**: \`${commitMessage}\``;
    
          app.client.chat.postMessage({
            channel: `D07LBMXD9FF`,
            text,
          });
          app.client.chat.postMessage({
            channel: `C07LEEB50KD`,
            text,
          });

          console.debug(commitMessage);
          if (commitMessage.startsWith("feat")) {
            app.client.chat.postMessage({
              channel: `C0P5NE354`,
              text: text,
            });
          }
          if (
            !commitMessage.includes("enhance") ||
            process.uptime() < 60 * 60
          ) {
            setTimeout(() => {
              process.exit();
            }, 1000);
          } else {
            app.client.chat.postMessage({
              channel: `D07LBMXD9FF`,
              text: `i dont restart fyi`,
            });
          }
        }
      }
    });
  }, 15000);
  return () => clearInterval(timer);
}
