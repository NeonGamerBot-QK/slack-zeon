import { exec } from "child_process";
export default function (app: any) {
  const timer = setInterval(() => {
    exec(`git pull`, (error, stdout) => {
      let response = error?.stdout ? error?.stdout[0].toString() : stdout;
      if (!error) {
        if (!response?.includes("Already up to date.")) {
          const commitMessage = require("child_process")
            .execSync("git log -1 --pretty=%B")
            .toString();
          console.log(`New git stuff wowie`);
          console.log(response);
          app.client.chat.postMessage({
            channel: `D07LBMXD9FF`,
            text: `*${commitMessage.trim()}*\`\`\`\n${response.slice(0, 4000)}\`\`\``,
          });
          app.client.chat.postMessage({
            channel: `C07LEEB50KD`,
            text: `*${commitMessage.trim()}*\`\`\`\n${response.slice(0, 4000)}\`\`\``,
          });

          console.debug(commitMessage);
          if (commitMessage.startsWith("feat")) {
            app.client.chat.postMessage({
              channel: `C0P5NE354`,
              text: `\`\`\`\n${response.slice(0, 4000)}\`\`\``,
            });
          }
          setTimeout(() => {
            process.exit();
          }, 1000);
        }
      }
    });
  }, 15000);
  return () => clearInterval(timer);
}
