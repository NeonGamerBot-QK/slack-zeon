import { ModifiedApp } from "./slackapp";
import pidusage from "pidusage";
const THRESHOLD_CPU = 80; // In percentage
const THRESHOLD_MEM = 700 * 1024 * 1024; // 700MB
export default function monitorMemCpu(app: ModifiedApp) {
  setInterval(() => {
    pidusage(process.pid, (err, stats) => {
      if (stats.cpu > THRESHOLD_CPU) {
        console.warn(`⚠️ High CPU: ${stats.cpu}%`);
        app.client.chat.postMessage({
          channel: `C07LEEB50KD`,
          text: `⚠️ High CPU: ${stats.cpu}%`,
        });
      }
      if (stats.memory > THRESHOLD_MEM) {
        console.warn(
          `⚠️ High Memory: ${(stats.memory / 1024 / 1024).toFixed(2)} MB`,
        );
        app.client.chat.postMessage({
          channel: `C07LEEB50KD`,
          text: `⚠️ High Memory: ${(stats.memory / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    });
  }, 3000);
}
