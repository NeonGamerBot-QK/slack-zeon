import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
export interface AirtableResponse {
  id: string;
  createdTime: string;
  fields: Fields;
}

export interface Fields {
  ships: string[];
  slack_id: string;
  autonumber: number;
  email: string;
  battles: string[];
  orders: string[];
  github_username: string;
  help_requests: string[];
  shop_true: boolean;
  address: string[];
  doubloon_grants: string[];
  "YSWS Verification User": string[];
  waka_last_synced_from_db: string;
  waka_last_heartbeat: string;
  waka_known_machine_count: number;
  waka_known_machines: string;
  waka_30_day_active_machine_count: number;
  waka_30_day_active_machines: string;
  waka_known_installation_count: number;
  waka_known_installations: string;
  waka_30_day_active_installation_count: number;
  waka_30_day_active_installations: string;
  waka_first_heartbeat: string;
  zapier_loops_marked_signed_up_at: string;
  zapier_loops_marked_wakatime_installed_at: string;
  waka_total_hours_logged: number;
  waka_30_day_hours_logged: number;
  arrpheus_ready_to_invite: boolean;
  arrpheus_slack_invite_failed: boolean;
  arrpheus_slack_invite_fail_reason: string;
  slack_email_is_duplicate: boolean;
  ysws_submission: string[];
  contest: string[];
  curse_blessing_status: string;
  last_step_completed: boolean;
  auto_num: number;
  "Fraud - Wonderdome Reports": string[];
  first_name: string[];
  last_name: string[];
  identifier: string;
  battles__explanation: string[];
  agggregated_battle_explanations: string;
  record_id: string;
  vote_quality_multiplier: number;
  vote_count: number;
  votes_expended: number;
  vote_balance: number;
  shipped_ship_count: number;
  verification_status: string[];
  eligible_to_vote: boolean;
  full_name: string;
  all_orders_string: string;
  academy_completed: boolean;
  preexisting_user: boolean;
  user_has_graduated: boolean;
  country: string[];
  all_project_repo_urls: string;
  battles__uniqueness_enforcement_string: string[];
  doubloons_paid: number;
  doubloons_granted: number;
  doubloons_spent: number;
  referral_credit_count: number;
  doubloons_balance: number;
  settled_tickets: number;
  ships_awaiting_vote_requirement_count: number;
  ships_with_vote_requirement_met_count: number;
  minimum_pending_vote_requirement: number;
  vote_balance_minus_minimum_pending_requirement: number;
  votes_remaining_for_next_pending_ship: number;
  votes_required_for_all_pending_ships: number;
  votes_remaining_for_all_pending_ships: number;
  unique_vote_count: number;
  duplicate_vote_count: number;
  unique_vote_explanation_count: number;
  aggregated_battle_explanations_length: number;
  aggregate_discordance: number;
  mean_discordance: number;
  all_battle_ship_autonumbers: string[];
  all_battle_ship_autonumbers_unique: string[];
  all_battle_ship_autonumber_strings: string[];
  magic_auth_link: string;
  magic_auth_message: string;
  orders_awaiting_mailout: any[];
  all_order_items: string[];
  orders__item_name: string[];
  verified_eligible: boolean;
  verification_alum: null[];
  orders__items: string[];
  staged_ships_count: number;
  last_activity_time: string;
  days_since_last_activity: number;
  hours_since_last_activity: number;
  sniffable_vote_count: number;
  telemetry_vote_count: number;
  winner_demo_opened_percentage: number;
  loser_demo_opened_percentage: number;
  demo_opened_percentage: number;
  winner_readme_opened_percentage: number;
  loser_readme_opened_percentage: number;
  readme_opened_percentage: number;
  winner_repo_opened_percentage: number;
  loser_repo_opened_percentage: number;
  repo_opened_percentage: number;
  clickthrough_trust_factor: number;
  total_vote_count: number;
  duplicate_vote_explanation_count: number;
  duplicate_vote_explanation_percentage: number;
  duplicate_explanation_trust_factor: number;
  mean_vote_time: number;
  time_trust_factor: number;
  consensus_violation_coefficient: number;
  consensus_violation_trust_factor: number;
  mean_rating_difference: number;
  mean_absolute_rating_difference: number;
  accordance_coefficient: number;
  accordance_coefficient_trust_factor: number;
  voting_trust_factor_sans_clickthrough: number;
  voting_trust_factor: number;
  average_ship_rating: number;
  verification_updated_at: string;
  duplicate_vote_explanation_count_prior_week: number;
  mean_consensus_disagreement: number;
  consensus_disagreement_coefficient: number;
  total_ships: number;
  vote_count_prior_week: number;
  aggregated_rating_differences: string;
  referral_link: string;
  impersonation_link: Impersonationlink;
  contest__all_slack_ids: string[];
  order_count_no_free_stickers: number;
  paid_out_ship_count: number;
  hakatime_has_coded: boolean;
  hakatime_installed: boolean;
  tutorial_ship_count: number;
  stage: string;
  contest__doubloons_per_dollar: number[];
  dollars_paid: number;
  total_real_money_we_spent: number;
  amount_earned_vs_fulfillment_cost: number;
  count_battles_exact_mention: number;
  battles_exact_mention_percentage: number;
  slack_profile_url: string;
  all_project_demo_urls: string;
  total_hours_shipped: number;
  average_doubloons_per_hour: number;
  created_at: string;
  days_since_joining: number;
  daily_hours_logged: number;
  days_since_first_heartbeat: number;
  daily_hours_shipped: number;
  days_between_first_and_last_heartbeats: number;
  first_heartbeat_modified_at: string;
  orders__item_name_list: string;
  dollars_fulfilled: number;
  doubloons_received: number;
  "didn't_complete_tutorial_bc_of_bug": number;
  stuck_in_tutorial_generally: number;
  show_in_leaderboard: boolean;
}

export interface Impersonationlink {
  label: string;
  url: string;
}
interface LeaderboardEntry {
  username: string;
  total_doubloons: number;
  current_doubloons: number;
  slack: string;
  id: string;
}
type Leaderboard = LeaderboardEntry[];
export function diffHighSeasLB(oldLB: Leaderboard, newLB: Leaderboard) {
  const msgs = [];
  for (const entry of newLB) {
    const oldEntry = oldLB.find((e) => e.id === entry.id);
    if (!oldEntry) {
      msgs.push(
        `:yay: <@${entry.id}> Welcome to the leaderboard joining us in #${
          newLB.indexOf(entry) + 1
        } place with \`${entry.current_doubloons}\` :doubloon: (${entry.total_doubloons} total)`,
      );
      continue;
    }

    const diff = entry.current_doubloons - oldEntry.current_doubloons;
    let newRankMessage =
      newLB.indexOf(entry) !== oldLB.findIndex((e) => e.id == entry.id)
        ? newLB.indexOf(entry) - oldLB.findIndex((e) => e.id == entry.id) > 0
          ? `You have moved down to #${newLB.indexOf(entry) + 1} from #${oldLB.findIndex((e) => e.id == entry.id) + 1} -- diff of ${newLB.indexOf(entry) - oldLB.findIndex((e) => e.id == entry.id)}, o: ${oldLB.findIndex((e) => e.id == entry.id)}, n: ${newLB.indexOf(entry)}  (debug)`
          : `You have moved up to #${newLB.indexOf(entry) + 1} from #${oldLB.findIndex((e) => e.id == entry.id) + 1} -- diff of ${newLB.indexOf(entry) - oldLB.findIndex((e) => e.id == entry.id)}, o: ${oldLB.findIndex((e) => e.id == entry.id)}, n: ${newLB.indexOf(entry)} (debug)`
        : ``;
    if (diff > 0) {
      msgs.push(
        `${newRankMessage ? (newRankMessage.includes("up") ? ":upvote:" : ":downvote:") : ""}:yay: *${entry.username}* You have gained \`${diff}\` :doubloon:. ${newRankMessage ?? "No rank change"}`,
      );
    } else if (diff < 0) {
      msgs.push(
        `${newRankMessage ? (newRankMessage.includes("up") ? ":upvote:" : ":downvote:") : ""}:noooovanish: *${entry.username}* You lost \`${Math.abs(diff)}\` :doubloon:. ${newRankMessage ?? "No rank change"}`,
      );
    }
  }
  return msgs;
}
export function diffAirtable(
  old: AirtableResponse,
  newD: AirtableResponse,
): string[] {
  const msgs: string[] = [];
  for (const key in newD.fields) {
    if (old.fields[key] !== newD.fields[key]) {
      msgs.push(
        `*${key}* changed from \`${JSON.stringify(old.fields[key])}\` to \`${JSON.stringify(newD.fields[key])}\``,
      );
    }
  }
  return msgs;
}
export async function cronForAirtable(app: ModifiedApp) {
  const data: AirtableResponse = await fetchPerson();
  const old: AirtableResponse = app.dbs.highseas.get("airtable") || {};
  const diffMessages = diffAirtable(old, data);
  if (diffMessages.length > 0) {
    app.client.chat
      .postMessage({
        channel: `C07R8DYAZMM`,
        text: `Airtable data changed :0`,
      })
      .then(async (r) => {
        for (const msg of diffMessages) {
          app.client.chat.postMessage({
            channel: `C07R8DYAZMM`,
            text: msg,
          });
          await new Promise((r) => setTimeout(r, 1000));
        }
      });
  }
}
export async function getActionHash(path, name) {
  const input = `/vercel/path0/${path}:${name}`;
  const hashed = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(hashed)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function fetchPerson() {
  const res = await fetch("https://highseas.hackclub.com/", {
    headers: {
      accept: "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": await getActionHash("src/app/utils/data.ts", "person"),
      cookie: process.env.HIGH_SEAS_COOKIES,
    },
    body: JSON.stringify([]),
    method: "POST",
  }).then((r) => r.text());
  const components = res
    .split("\n")
    .map((x) => x.substring(x.indexOf(":") + 1));
  return JSON.parse(
    `{"id":"` + components[components.length - 2].split(`{"id":"`)[1],
  );
}

export function highSeasCron(app: ModifiedApp) {
  cron.schedule(`*/2 * * * *`, async () => {
    try {
      await fetch("https://highseas.hackclub.com/shipyard", {
        method: "POST",
        headers: {
          Cookie: process.env.HIGH_SEAS_COOKIES,
        },
        body: "[]",
      }).then((r) => {
        const oldAmount = app.db.get(`highseas_tickets`);
        const cookieHeader = r.headers
          .getSetCookie()
          .find((e) => e.startsWith("tickets="));
        const amount = parseFloat(
          cookieHeader.split(`tickets=`)[1].split(";")[0],
        ).toFixed(2);
        // console.log(`You have ${parseFloat(amount).toFixed(2)} amount of doubloons`)
        app.db.set(`highseas_tickets`, amount);
        if (oldAmount !== amount) {
          const diff = parseFloat(
            (parseFloat(amount) - parseFloat(oldAmount)).toFixed(2),
          );
          app.client.chat.postMessage({
            text: `*Doubloonies* :3\n:doubloon: ${oldAmount} -> ${amount} :doubloon: (diff ${diff > 0 ? `+${diff}` : diff} :doubloon: )`,
            channel: `C07R8DYAZMM`,
          });
        }
      });
    } catch (e) {
      await app.client.chat.postMessage({
        text: `*Doubloonies* :3\n:x: Error :x: maybe update ur token for high seas\n\n${e.stack}`,
        channel: `C07LGLUTNH2`,
      });
    }
  });
  cron.schedule("0 * * * *", async () => {
    await cronForAirtable(app);
  });
  cron.schedule("*/10 * * * *", async () => {
    try {
      // update da cache
      const oldInstance = app.db.get(`highseas_lb`) || [];
      const newInstance = await getLb();
      const all_entries = app.db.get(`highseas_lb_all_entries`) || [];
      // run diff for all users who have opted in
      if (app.db.get(`highseas_lb_ts`)) {
        try {
          await app.client.chat.delete({
            channel: `C086HHP5J7K`,
            ts: app.db.get(`highseas_lb_ts`)!,
          });
        } catch (e) {
          app.db.delete(`highseas_lb_ts`);
        }
      }

      const msgs = diffHighSeasLB(oldInstance, newInstance);
      if (msgs.length > 0) {
        await app.client.chat
          .postMessage({
            channel: `C086HHP5J7K`,
            text: `:thread: Leaderboard changes as of ${new Date().toLocaleString()} :thread:`,
          })
          .then(async (e) => {
            for (const msg of msgs) {
              //
              await app.client.chat.postMessage({
                channel: `C086HHP5J7K`,
                text: msg,
                thread_ts: e.ts,
              });
              await fetch(process.env.CANVAS_URL, {
                method: "POST",
                body: JSON.stringify({
                  text: msg,
                }),
              });
              await new Promise((r) => setTimeout(r, 400));
            }
          });
      }
      await app.client.chat
        .postMessage({
          channel: `C086HHP5J7K`,
          text: `*High Seas Lb* (top 10)\n${newInstance
            .slice(0, 10)
            .map(
              (d) =>
                `\`${d.username}\` - ${parseInt(d.current_doubloons)} :doubloon:`,
            )
            .join("\n")}`,
          parse: "none",
        })
        .then((e) => {
          app.db.set(`highseas_lb_ts`, e.ts);
        });

      for (const user of app.db.get(`i_want_to_track_my_doubloons`) || []) {
        const oldUserData = oldInstance.find((e) => e.id == user.id);
        const newUserData = newInstance.find((e) => e.id == user.id);
        if (!oldUserData && !newUserData) continue;
        if (oldUserData && newUserData) {
        }
      }
      app.db.set(`highseas_lb`, newInstance);
      all_entries.push(newInstance);
      app.db.set(`highseas_lb_all_entries`, all_entries);
    } catch (e) {
      await app.client.chat.postMessage({
        text: `high seas lb ded\n\n${e.stack}`,
        channel: `C07LGLUTNH2`,
      });
    }
  });
}

export async function getLb() {
  const all_users = [];
  const page0 = await fetch(
    "https://doubloons.cyteon.hackclub.app/api/v1/data?page=1",
  ).then((r) => r.json());
  const pages = page0.pages;
  for (let i = 0; i < pages; i++) {
    const page = fetch(
      `https://doubloons.cyteon.hackclub.app/api/v1/data?page=${i + 1}`,
    )
      .then((r) => r.json())
      .then((r) => r.users);
    all_users.push(page);
  }
  return (await Promise.all(all_users)).flat().map((e) => {
    e.slack = e.slack.replace("https://hackclub.slack.com/team/", "");
    return e;
  });
}
