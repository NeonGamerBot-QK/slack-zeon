import { ModifiedApp } from "./slackapp";
import { Pool } from "pg";

const NEONS_CHANNEL = "C07R8DYAZMM";
const XP_PER_MESSAGE = 10;
const XP_PER_LEVEL = 100;
const TABLE_NAME = "levelsystem";

// Channel-specific XP multipliers
const CHANNEL_MULTIPLIERS: Record<string, number> = {
  C09KP0Y8947: 1.05,
  C0869S20RMM: 1.1,
};

// All channels that track XP
const LEVELING_CHANNELS = [NEONS_CHANNEL, ...Object.keys(CHANNEL_MULTIPLIERS)];

interface UserLevel {
  userId: string;
  level: number;
  xp: number;
}

let pool: Pool;

// Initialize pool
export function initPGPool(): void {
  pool = new Pool({
    connectionString: process.env.PSQL_URL,
  });
}

// Ensure table exists
async function ensureTableExists(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      user_id VARCHAR(50) PRIMARY KEY,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(query);
}

// Calculate level from XP
function getLevelFromXP(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL);
}

// Get XP needed for next level
function getXPForNextLevel(currentXp: number): number {
  const currentLevel = getLevelFromXP(currentXp);
  return (currentLevel + 1) * XP_PER_LEVEL - currentXp;
}

// Calculate XP multiplier based on channel and day of week
function getXPMultiplier(channelId: string): number {
  let multiplier = CHANNEL_MULTIPLIERS[channelId] || 1;

  // Double the multiplier on weekends (Saturday = 6, Sunday = 0)
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    multiplier *= 2;
  }

  return multiplier;
}

// Get user level data
async function getUserLevel(userId: string): Promise<UserLevel> {
  const result = await pool.query(
    `SELECT user_id as "userId", xp, level FROM ${TABLE_NAME} WHERE user_id = $1`,
    [userId],
  );

  if (result.rows.length === 0) {
    return { userId, level: 0, xp: 0 };
  }
  return result.rows[0];
}

// Update user level
async function updateUserLevel(
  userId: string,
  xpGain: number,
): Promise<UserLevel | null> {
  const userData = await getUserLevel(userId);
  const oldLevel = userData.level;

  userData.xp += xpGain;
  userData.level = getLevelFromXP(userData.xp);

  await pool.query(
    `INSERT INTO ${TABLE_NAME} (user_id, xp, level) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET xp = $2, level = $3, updated_at = CURRENT_TIMESTAMP`,
    [userId, userData.xp, userData.level],
  );

  // Return user data if they leveled up
  if (userData.level > oldLevel) {
    return userData;
  }

  return null;
}

// Initialize leveling system
export function initLevelingSystem(app: ModifiedApp): void {
  // Listen for messages in leveling channels
  app.message(async ({ message, client }) => {
    // Only track messages in leveling channels
    if (!LEVELING_CHANNELS.includes(message.channel)) return;

    // Ignore bot messages, threads, and edits
    //@ts-ignore
    if (
      //@ts-ignore
      message.bot_id ||
      message.subtype === "message_changed" ||
      //@ts-ignore
      message.thread_ts
    ) {
      return;
    }

    //@ts-ignore
    const userId = message.user;
    if (!userId) return;

    try {
      // Calculate XP gain with channel multiplier
      const multiplier = getXPMultiplier(message.channel);
      const xpGain = Math.floor(XP_PER_MESSAGE * multiplier);

      const leveledUp = await updateUserLevel(userId, xpGain);

      // Log XP gain to logsnag
      try {
        await app.logsnag.insight.increment({
          icon: "⚡",
          title: "XP Gained",
          value: xpGain,
        });
      } catch (logError) {
        console.error("Error logging XP gain to logsnag:", logError);
      }

      // Announce and log level up
      if (leveledUp) {
        const emoji =
          leveledUp.level % 10 === 0
            ? "🎉"
            : leveledUp.level % 5 === 0
              ? "⭐"
              : "✨";

        await client.chat.postMessage({
          channel: message.channel,
          //@ts-ignore
          thread_ts: message.ts,
          text: `${emoji} <@${userId}> reached level ${leveledUp.level}!`,
        });

        // Log level up event to logsnag
        try {
          await app.logsnag.track({
            channel: "leveling",
            event: "level_up",
            user_id: userId,
            icon: emoji,
            tags: {
              level: leveledUp.level,
              total_xp: leveledUp.xp,
            },
          });

          // Increment level up counter
          await app.logsnag.insight.increment({
            icon: emoji,
            title: "Total Level Ups",
            value: 1,
          });
        } catch (logError) {
          console.error("Error logging level up to logsnag:", logError);
        }
      }
    } catch (error) {
      console.error("Error updating user level:", error);
    }
  });
}

// Get leaderboard
export async function getLevelLeaderboard(
  limit: number = 10,
): Promise<UserLevel[]> {
  const result = await pool.query(
    `SELECT user_id as "userId", xp, level FROM ${TABLE_NAME} 
     ORDER BY level DESC, xp DESC LIMIT $1`,
    [limit],
  );

  return result.rows;
}

// Export functions for commands
export { getUserLevel, getXPForNextLevel, ensureTableExists };
