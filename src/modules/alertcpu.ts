import { ModifiedApp } from "./slackapp";
import pidusage from "pidusage";
const THRESHOLD_CPU = 85; // In percentage
const THRESHOLD_MEM = 1850 * 1024 * 1024; // 850mb
let spike_index = 0;

export default function monitorMemCpu(app: ModifiedApp) {
  setInterval(() => {
    pidusage(process.pid, (err, stats) => {
      if (!stats) return;
      if (stats.cpu > THRESHOLD_CPU) {
        console.warn(`⚠️ High CPU: ${stats.cpu}%`);
        spike_index++;
        if (spike_index > 3) {
          app.client.chat.postMessage({
            channel: `C07LEEB50KD`,
            text: `⚠️ High CPU: ${stats.cpu}%`,
          });
        }
      }
      if (stats.memory > THRESHOLD_MEM) {
        spike_index++;
        console.warn(
          `⚠️ High Memory: ${(stats.memory / 1024 / 1024).toFixed(2)} MB`,
        );
        if (spike_index > 3) {
          app.client.chat.postMessage({
            channel: `C07LEEB50KD`,
            text: `⚠️ High Memory: ${(stats.memory / 1024 / 1024).toFixed(2)} MB`,
          });
        }
      }
      if (
        stats.memory < THRESHOLD_MEM &&
        stats.cpu < THRESHOLD_CPU &&
        spike_index > 0
      ) {
        spike_index--;
      }
    });
  }, 30_000);
}
