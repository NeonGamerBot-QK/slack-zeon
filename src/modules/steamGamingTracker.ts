import { ModifiedApp } from "./slackapp";

/**
 * Steam Gaming Tracker Module
 *
 * Polls the Steam GetPlayerSummaries API to detect when the user is
 * currently playing a game. Sends an alert to #neon-alerts when a
 * gaming session is detected and again when it ends.
 */

// #neon-alerts channel (same as amp/hcai alerts)
const ALERT_CHANNEL = "C09JNTXEU9Z";

const STEAM_PLAYER_SUMMARY_URL =
  "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/";

/** Response shape for GetPlayerSummaries */
interface PlayerSummary {
  steamid: string;
  personaname: string;
  personastate: number;
  gameextrainfo?: string;
  gameid?: string;
}

interface SteamSummaryResponse {
  response: {
    players: PlayerSummary[];
  };
}

// Tracks the currently detected game so we only alert once per session
let currentGame: string | null = null;

/**
 * Fetches the player summary from Steam to check if a game is being played.
 * @returns The player summary or null on failure
 */
async function fetchPlayerSummary(): Promise<PlayerSummary | null> {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    console.warn("STEAM_API_KEY or STEAM_ID not set, skipping gaming check.");
    return null;
  }

  try {
    const url = `${STEAM_PLAYER_SUMMARY_URL}?key=${apiKey}&steamids=${steamId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Steam API returned status ${response.status}`);
      return null;
    }

    const data: SteamSummaryResponse = await response.json();
    return data.response?.players?.[0] ?? null;
  } catch (err) {
    console.error("Failed to fetch Steam player summary:", err);
    return null;
  }
}

/**
 * Checks if the user is currently playing a Steam game and alerts #neon-alerts.
 * Only fires once per gaming session (when a new game is detected).
 * Also alerts when the gaming session ends.
 * @param app - The Slack Bolt app instance
 */
export async function checkSteamGaming(app: ModifiedApp): Promise<void> {
  const player = await fetchPlayerSummary();
  if (!player) return;

  // personastate 0 = Offline — skip detection entirely when offline
  if (player.personastate === 0) return;

  const gameName = player.gameextrainfo ?? null;

  if (gameName && gameName !== currentGame) {
    // New game detected — send alert
    const storeUrl = player.gameid
      ? `https://store.steampowered.com/app/${player.gameid}`
      : null;

    await app.client.chat.postMessage({
      channel: ALERT_CHANNEL,
      text: `:video_game: *Gaming alert!* ${player.personaname} is now playing *${gameName}*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:video_game: *Gaming Alert!*\n*${player.personaname}* was just caught playing *${gameName}* on Steam.`,
          },
        },
        ...(storeUrl
          ? [
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "View on Steam",
                      emoji: true,
                    },
                    url: storeUrl,
                    action_id: `steam_game_${player.gameid}`,
                  },
                ],
              },
            ]
          : []),
      ],
    });

    console.log(`Steam gaming alert: ${player.personaname} playing ${gameName}`);
    currentGame = gameName;
  } else if (!gameName && currentGame) {
    // Game session ended
    await app.client.chat.postMessage({
      channel: ALERT_CHANNEL,
      text: `:video_game: *${player.personaname}* stopped playing *${currentGame}*.`,
    });

    console.log(`Steam gaming session ended: ${currentGame}`);
    currentGame = null;
  }
}
