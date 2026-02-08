import { Pool } from "pg";
import { ModifiedApp } from "./slackapp";

/**
 * Lapse Tracker Module
 *
 * Fetches lapse data from https://lapse.hackclub.com/api/trpc/timelapse.findByUser
 * and alerts on new published lapses. Stores seen lapses in PostgreSQL.
 */

// Same channel as amp/hcai alerts
const ALERT_CHANNEL = "C09JNTXEU9Z";
const TABLE_NAME = "lapse_tracker";
const LAPSE_USER_ID = "HuhRJDfr8XGO"; // public info
const LAPSE_API_URL = `https://lapse.hackclub.com/api/trpc/timelapse.findByUser?input=%7B%22user%22%3A%22${LAPSE_USER_ID}%22%7D`;

// API response types
export interface LapseApiResponse {
  result: LapseResult;
}

export interface LapseResult {
  data: LapseData2;
}

export interface LapseData2 {
  ok: boolean;
  data: LapseData;
}

export interface LapseData {
  timelapses: Timelapse[];
}

export interface Timelapse {
  id: string;
  createdAt: number;
  owner: LapseOwner;
  name: string;
  description: string;
  comments: unknown[];
  visibility: string;
  isPublished: boolean;
  playbackUrl: string;
  thumbnailUrl: string;
  videoContainerKind: string;
  duration: number;
}

export interface LapseOwner {
  id: string;
  createdAt: number;
  handle: string;
  displayName: string;
  profilePictureUrl: string;
  bio: string;
  urls: unknown[];
  hackatimeId: string;
  slackId: string;
}

let pool: Pool;

/**
 * Initializes the PostgreSQL connection pool for lapse tracker.
 * @param connectionString - The PostgreSQL connection string
 */
export function initLapsePool(connectionString: string): void {
  pool = new Pool({ connectionString });
}

/**
 * Ensures the lapse tracker table exists in the database.
 */
async function ensureTableExists(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      playback_url TEXT,
      thumbnail_url TEXT,
      duration INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(query);
}

/**
 * Fetches current lapses from the API.
 * @returns Array of timelapses or null on failure
 */
async function fetchLapses(): Promise<Timelapse[] | null> {
  try {
    const response = await fetch(LAPSE_API_URL);
    if (!response.ok) {
      console.error(`Lapse API returned status ${response.status}`);
      return null;
    }

    const data: LapseApiResponse = await response.json();
    if (!data.result?.data?.ok || !data.result?.data?.data?.timelapses) {
      console.error("Invalid lapse API response structure");
      return null;
    }

    return data.result.data.data.timelapses;
  } catch (err) {
    console.error("Failed to fetch lapses:", err);
    return null;
  }
}

/**
 * Gets all seen lapse IDs from the database.
 * @returns Set of lapse IDs that have been seen
 */
async function getSeenLapseIds(): Promise<Set<string>> {
  const result = await pool.query(`SELECT id FROM ${TABLE_NAME}`);
  return new Set(result.rows.map((row) => row.id));
}

/**
 * Saves a lapse to the database.
 * @param lapse - The lapse to save
 */
async function saveLapse(lapse: Timelapse): Promise<void> {
  await pool.query(
    `INSERT INTO ${TABLE_NAME} (id, name, description, playback_url, thumbnail_url, duration, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0))
     ON CONFLICT (id) DO NOTHING`,
    [
      lapse.id,
      lapse.name,
      lapse.description,
      lapse.playbackUrl,
      lapse.thumbnailUrl,
      lapse.duration,
      lapse.createdAt,
    ],
  );
}

/**
 * Checks for new lapses and posts alerts to Slack.
 * @param app - The Slack Bolt app instance
 */
export async function checkForNewLapses(app: ModifiedApp): Promise<void> {
  try {
    await ensureTableExists();

    const lapses = await fetchLapses();
    if (lapses === null) {
      console.warn("Failed to fetch lapses.");
      return;
    }

    // Filter to only published lapses
    const publishedLapses = lapses.filter((l) => l.isPublished);
    const seenIds = await getSeenLapseIds();

    // Find new published lapses
    const newLapses = publishedLapses.filter((l) => !seenIds.has(l.id));

    for (const lapse of newLapses) {
      // Save to DB first
      await saveLapse(lapse);

      // Send alert
      const durationStr = lapse.duration
        ? `${Math.floor(lapse.duration / 60)}m ${lapse.duration % 60}s`
        : "unknown duration";

      await app.client.chat.postMessage({
        channel: ALERT_CHANNEL,
        text: `:lapse: New lapse published! *${lapse.name}*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:lapse: *New Lapse Published!*\n*Title:* ${lapse.name}\n*Description:* ${lapse.description || "_No description_"}\n*Duration:* ${durationStr}`,
            },
            accessory: lapse.thumbnailUrl
              ? {
                  type: "image",
                  image_url: lapse.thumbnailUrl,
                  alt_text: lapse.name,
                }
              : undefined,
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Watch Lapse",
                  emoji: true,
                },
                url:
                  lapse.playbackUrl ||
                  `https://lapse.hackclub.com/@neon/${lapse.id}`,
                action_id: `watch_lapse_${lapse.id}`,
              },
            ],
          },
        ],
      });

      console.log(`Alerted for new lapse: ${lapse.name}`);
    }

    if (newLapses.length === 0) {
      console.log("No new lapses found.");
    }
  } catch (err) {
    console.error("Error checking for new lapses:", err);
  }
}

/**
 * Gets today's lapses for the "how was your day" summary.
 * @returns Array of today's lapses or empty array
 */
export async function getTodaysLapses(): Promise<Timelapse[]> {
  try {
    const lapses = await fetchLapses();
    if (lapses === null) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    // Filter to lapses created today and published
    return lapses.filter((l) => l.isPublished && l.createdAt >= todayStart);
  } catch (err) {
    console.error("Error getting today's lapses:", err);
    return [];
  }
}

/**
 * Formats today's lapses as a string for the "how was your day" message.
 * @returns Formatted string of today's lapses
 */
export async function getTodaysLapsesString(): Promise<string> {
  const lapses = await getTodaysLapses();

  if (lapses.length === 0) {
    return "No lapses recorded today...";
  }

  const lapseLines = lapses.map((l) => {
    const durationStr = l.duration
      ? `${Math.floor(l.duration / 60)}m ${l.duration % 60}s`
      : "?";
    return `- *${l.name}* (${durationStr}) - <${l.playbackUrl || `https://lapse.hackclub.com/@neon/${l.id}`}|watch>`;
  });

  return `You recorded *${lapses.length}* lapse${lapses.length > 1 ? "s" : ""} today :lapse:\n${lapseLines.join("\n")}`;
}
