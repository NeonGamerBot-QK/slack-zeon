import { Pool } from "pg";

// Channel to post updates (same as amp tracker)
const TRACKER_CHANNEL = "C09JNTXEU9Z";
const TABLE_NAME = "hcai_balance_tracker";

// API endpoint for HCAI status
const HCAI_API_URL = "https://ai.hackclub.com/up";

interface HCAIStatusResponse {
  balanceRemaining: number;
  [key: string]: unknown;
}

let pool: Pool;

/**
 * Initializes the PostgreSQL connection pool for HCAI tracker.
 * Uses the same connection string as other modules.
 * @param connectionString - The PostgreSQL connection string
 */
export function initHCAIPool(connectionString: string): void {
  pool = new Pool({ connectionString });
}

/**
 * Ensures the HCAI balance tracker table exists in the database.
 * Creates the table if it doesn't exist.
 */
async function ensureTableExists(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id SERIAL PRIMARY KEY,
      balance DECIMAL(12, 2) NOT NULL,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(query);
}

/**
 * Fetches the current HCAI balance from the API.
 * @returns The balance remaining in dollars, or null if fetch fails
 */
async function fetchHCAIBalance(): Promise<number | null> {
  try {
    const response = await fetch(HCAI_API_URL);
    if (!response.ok) {
      console.error(`HCAI API returned status ${response.status}`);
      return null;
    }

    const data: HCAIStatusResponse = await response.json();
    if (typeof data.balanceRemaining !== "number") {
      console.error("Invalid balanceRemaining in HCAI response");
      return null;
    }

    return data.balanceRemaining;
  } catch (err) {
    console.error("Failed to fetch HCAI balance:", err);
    return null;
  }
}

/**
 * Gets the last recorded balance from the database.
 * @returns The last balance or null if no records exist
 */
async function getLastBalance(): Promise<number | null> {
  const result = await pool.query(
    `SELECT balance FROM ${TABLE_NAME} ORDER BY recorded_at DESC LIMIT 1`,
  );
  if (result.rows.length === 0) {
    return null;
  }
  return parseFloat(result.rows[0].balance);
}

/**
 * Saves the current balance to the database.
 * @param balance - The balance to save
 */
async function saveBalance(balance: number): Promise<void> {
  await pool.query(`INSERT INTO ${TABLE_NAME} (balance) VALUES ($1)`, [
    balance,
  ]);
}

/**
 * Checks the HCAI balance and posts updates to Slack if it has changed.
 * Stores balance history in PostgreSQL for persistence.
 * @param app - The Slack Bolt app instance
 */
export async function checkHCAICredits(app: any): Promise<void> {
  try {
    await ensureTableExists();

    const currentBalance = await fetchHCAIBalance();
    if (currentBalance === null) {
      console.warn("Failed to fetch HCAI balance.");
      return;
    }

    const lastBalance = await getLastBalance();

    // First run - just record initial balance
    if (lastBalance === null) {
      await saveBalance(currentBalance);
      await app.client.chat.postMessage({
        channel: TRACKER_CHANNEL,
        text: `🔄 Initial HCAI balance check: $${currentBalance.toFixed(2)}`,
      });
      return;
    }

    const diff = currentBalance - lastBalance;
    if (diff !== 0) {
      const sign = diff > 0 ? "⬆️" : "⬇️";
      const message = `${sign} HCAI balance changed by $${diff.toFixed(2)}. Current: $${currentBalance.toFixed(2)}`;
      await app.client.chat.postMessage({
        channel: TRACKER_CHANNEL,
        text: message,
      });
      await saveBalance(currentBalance);
    } else {
      console.log("No HCAI balance change detected.");
    }
  } catch (err) {
    console.error("Error checking HCAI balance:", err);
  }
}

/**
 * Gets the current HCAI balance for display purposes.
 * @returns A formatted string with the current balance, or null on error
 */
export async function getHCAIBalance(): Promise<string | null> {
  const balance = await fetchHCAIBalance();
  if (balance === null) return null;
  return `$${balance.toFixed(2)}`;
}
