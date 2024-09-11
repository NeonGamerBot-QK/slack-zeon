import { exec } from "child_process";
export default function (app: any) {
  const timer = setInterval(() => {
    exec(`git pull`, (error, stdout) => {
      let response = error?.stdout ? error?.stdout[0].toString() : stdout;
      if (!error) {
        if (!response?.includes("Already up to date.")) {
          console.log(`New git stuff wowie`);
          console.log(response);
          app.client.chat.postMessage({
            channel: `D07LBMXD9FF`,
            text: `\`\`\`\n${response.slice(0, 4000)}\`\`\``,
          });
          setTimeout(() => {
            process.exit();
          }, 1000);
        }
      }
    });
  }, 15000);
  return () => clearInterval(timer);
}
