import { Cron } from "croner";
import { ModifiedApp } from "./slackapp";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

export async function doMinUpdate(app: ModifiedApp) {
  //@ts-ignore
  if (app.over) return;
  const data = await fetch("https://shipwrecked.hackclub.com/api/stats/count")
    .then((r) => r.json())
    .then((e) => e.count);
  const referralCount = await fetch(
    "https://raffle.a.selfhosted.hackclub.com/referrals",
    { method: "POST" },
  )
    .then((r) => r.json())
    .then((d) => d.totalReferrals);

  const lastEntry = app.db.get("shipwreck_count") || 0;
  const lastReferralEntry = app.db.get("shipwreck_ref") || 0;
  if (lastEntry !== data || lastReferralEntry !== referralCount) {
    const allEntries = app.db.get("ship_wrecks_entries") || [];
    allEntries.push({
      count: data,
      ref: referralCount,
      date: new Date().toISOString(),
    });
    app.db.set("ship_wrecks_entries", allEntries);

    if (lastEntry !== data) {
      app.db.set("shipwreck_count", data);

      app.client.chat.postMessage({
        channel: "C08P152AU94",
        username: "Shipwreck counter",
        icon_emoji: ":shipwrecked:",
        text: `:shipwrecked:  Shipwreck count is now \`${data}\` (diff of \`${data - lastEntry}\`)`,
      });
      if (data >= 5000) {
        app.client.chat.postMessage({
          channel: "C08P152AU94",
          username: "Shipwreck counter",
          icon_emoji: ":shipwrecked:",
          text: `:shipwreck: Shipwreck count is now \`${data}\` :fire: I'm going to go to sleep :zzz:`,
        });

        app.client.chat.postMessage({
          channel: "C08N0R86DMJ",
          username: "Shipwreck counter",
          icon_emoji: ":shipwrecked:",
          text: `:shipwreck: Shipwreck count is now \`${data}\` :fire: I'm going to go to sleep :zzz:`,
        });
        // ping @everyone
        app.client.chat.postMessage({
          text: `@everyone`,
          channel: "C08P152AU94",
        });
        //@ts-ignore
        app.over = true;
      }
      if (lastReferralEntry !== referralCount) {
        app.db.set("shipwreck_ref", referralCount);

        app.client.chat.postMessage({
          channel: "C08P152AU94",
          username: "Shipwreck counter",
          icon_emoji: ":shipwrecked:",
          text: `:shipwrecked:  Shipwreck ref count is now \`${referralCount}\` (diff of \`${referralCount - lastReferralEntry}\`)`,
        });
      }
    }
  }
}
function addArray(arr: any[]) {
  let c = 0;
  for (const i of arr) {
    c += i.count;
  }
  return c;
}
export async function majorUpdate(app: ModifiedApp, channel_id: string) {
  // get time for the last 12h
  const last12h = new Date(new Date().getTime() - 12 * 60 * 60 * 1000);
  const data = app.db.get("ship_wrecks_entries") || [];
  const entries = data.filter(
    (e) => new Date(e.date).getTime() > last12h.getTime(),
  );
  const count = entries[0].count;
  app.client.chat.postMessage({
    channel: channel_id,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:shipwrecked:  Shipwreck count is now at \`${data[data.length - 1].count}\` over the last 12 hours it has gained \`+${data[data.length - 1].count - count}\` rsvp's :shipwrecked-bottle:`,
        },
      },
      {
        // image
        type: "image",
        title: {
          type: "plain_text",
          text: "Shipwreck graph over the last 12 hours",
        },
        alt_text: "Shipwreck graph over the last 12 hours",
        image_url:
          "https://slack.mybot.saahild.com/count_over_time_from_url12h.png",
      },
    ],
  });
}
export function setupShipwrecked(app: ModifiedApp) {
  new Cron("* * * * *", async () => {
    await doMinUpdate(app);
  });
  new Cron("0 8,20 * * *", async () => {
    await majorUpdate(app, "C08N0R86DMJ");
  });
}

// Format ISO date to "YYYY-MM-DD"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}
const width = 1200;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour: "white",
  chartCallback: (ChartJS) => {
    ChartJS.defaults.color = "#333";
    ChartJS.defaults.font.family = "'Segoe UI', sans-serif";
    ChartJS.defaults.font.size = 14;
  },
});
export async function generateGraph(app: ModifiedApp) {
  // Settings
  const url = "https://slack.mybot.saahild.com/shipwreck-data.json";

  const imagePath = "./count_over_time_from_url.png";

  try {
    const data = app.db.get("ship_wrecks_entries").filter((_, i) => i % 2 == 0);

    const dates = data.map((entry: any) => formatDate(entry.date));
    const counts = data.map((entry: any) => entry.count);

    // const chartJSNodeCanvas = new ChartJSNodeCanvas({
    //   width,
    //   height,
    //   backgroundColour: "white",
    //   chartCallback: (ChartJS) => {
    //     ChartJS.defaults.color = "#333";
    //     ChartJS.defaults.font.family = "'Segoe UI', sans-serif";
    //     ChartJS.defaults.font.size = 14;
    //   },
    // });

    const config = {
      type: "line" as const,
      data: {
        labels: dates,
        datasets: [
          {
            label: "RSVP Sign Ups",
            data: counts,
            borderColor: "#007BFF",
            backgroundColor: "rgba(0, 123, 255, 0.2)",
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "#007BFF",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: "📈 RSVP Sign Ups Over Time",
            font: {
              size: 22,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Date",
              font: {
                weight: "bold",
              },
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              color: "#eee",
            },
          },
          y: {
            title: {
              display: true,
              text: "Sign Up Count",
              font: {
                weight: "bold",
              },
            },
            ticks: {
              callback: (value: any) => `${value}`,
            },
            grid: {
              color: "#f3f3f3",
            },
          },
        },
      },
    };
    //@ts-ignore
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);
    return imageBuffer;
    // console.log(`✅ Pretty graph saved to ${imagePath}`);
  } catch (err) {
    console.error("❌ Error generating chart:", err);
    return Buffer.from("well shit");
  }
}

export async function generateGraph12h(app: ModifiedApp) {
  const width = 1200;
  const goal = 5000;
  const height = 600;
  const highlightLast12Hours = true;
  try {
    const data = ((await app.db.get("ship_wrecks_entries")) || []).filter(
      (_, i) => i % 2 == 0,
    );

    // Dates and counts
    const rawDates = data.map((entry: any) => new Date(entry.date));
    const formattedDates = rawDates.map((d) => d.toISOString().split("T")[0]);
    const counts = data.map((entry: any) => entry.count);

    // Highlight last 12 hours if the variable is true
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const normalData = counts.map((count: number, i: number) =>
      rawDates[i] < twelveHoursAgo ? count : null,
    );

    // If `highlightLast12Hours` is true, highlight data within the last 12 hours
    const highlightData = highlightLast12Hours
      ? counts.map((count: number, i: number) =>
          rawDates[i] >= twelveHoursAgo ? count : null,
        )
      : new Array(counts.length).fill(null); // Empty array if no highlighting

    // Estimate progress toward goal
    const startDate = rawDates[0];
    const endDate = rawDates[rawDates.length - 1];
    const totalCount = counts[counts.length - 1];
    const totalDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const avgPerDay = totalCount / totalDays;
    const remaining = goal - totalCount;
    const estimatedDaysLeft = remaining / avgPerDay;
    const estimatedGoalDate = new Date(
      now.getTime() + estimatedDaysLeft * 24 * 60 * 60 * 1000,
    );

    console.log(`📊 Current count: ${totalCount}`);
    console.log(`🎯 Goal: ${goal}`);
    console.log(`📈 Average per day: ${avgPerDay.toFixed(2)}`);
    console.log(
      `⏳ Days left: ${estimatedDaysLeft.toFixed(1)} (ETA: ${estimatedGoalDate.toDateString()})`,
    );

    // Chart render setup

    const config = {
      type: "line" as const,
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: "Previous Data",
            data: normalData,
            borderColor: "#007BFF",
            backgroundColor: "rgba(0,123,255,0.1)",
            fill: false,
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: "Last 12 Hours",
            data: highlightData,
            borderColor: "#FF4136",
            backgroundColor: "rgba(255,65,54,0.2)",
            fill: false,
            tension: 0.4,
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: "📈 RSVP Sign Ups Over Time (Last 12h Highlighted)",
            font: {
              size: 22,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Date",
              font: { weight: "bold" },
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              maxTicksLimit: 10,
            },
            grid: {
              color: "#eee",
            },
          },
          y: {
            title: {
              display: true,
              text: "Sign Up Count",
              font: { weight: "bold" },
            },
            grid: {
              color: "#f3f3f3",
            },
            ticks: {
              callback: (value: any) => `${value}`,
            },
          },
        },
      },
    };
    //@ts-ignore
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);
    //   await writeFile(imagePath, imageBuffer);
    return imageBuffer;
    //   console.log(`✅ Chart saved to ${imagePath}`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}
