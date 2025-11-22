import { exec } from "child_process";
import { readFileSync } from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

export default function (app: any) {
  const timer = setInterval(async () => {
    try {
      // First run git pull asynchronously
      const { stdout, stderr } = await execAsync("git pull");
      const response = stdout || stderr;

      if (response && !response.includes("Already up to date.") && response.includes("Updating")) {
        console.log(`New git stuff wowie`);
        console.log(response);

        // Only perform heavy synchronous operations if there WAS an update
        const bcommitMessage = require("child_process")
          .execSync("git log -1 --pretty=%B")
          .toString();
        
        // We can't reliably get the "before" hash easily after pulling without tracking it,
        // but for the message we can just show the new state.
        // Or we can optimize this later. For now, just unblocking the loop is key.
        
        const hash = readFileSync(".git/refs/heads/main")
          .toString()
          .split("\n")[0];
          
        const compareStr =
            response.split("Updating ")[1]?.split("\n")[0]?.trim() || "Update";

        const text = `\`${new Date().toISOString()}\` Automatic update from GitHub.\n\`\`\`${response.slice(0, 1700)}\`\`\`\n*Latest Commit*: \`${hash}\`\n\`\`\`${bcommitMessage}\`\`\``;

        await app.client.chat.postMessage({
          channel: `D07LBMXD9FF`,
          text,
        });
        await app.client.chat.postMessage({
            channel: `C07LEEB50KD`,
            text,
        });

        if (bcommitMessage.startsWith("feat")) {
             await app.client.chat.postMessage({
              channel: `C0P5NE354`,
              text: text,
            });
        }

        // Restart logic
        if (!bcommitMessage.includes("enhance") || process.uptime() < 60 * 60) {
            setTimeout(() => {
              process.exit(0);
            }, 1000);
        } else {
            app.client.chat.postMessage({
                channel: `D07LBMXD9FF`,
                text: `i dont restart fyi`,
            });
        }
      }
    } catch (e) {
      console.error("Git watch error:", e);
    }
  }, 5 * 60 * 1000); // 5 minutes
  return () => clearInterval(timer);
}
