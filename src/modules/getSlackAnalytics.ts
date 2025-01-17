// sourced from skyfall :3
import { Temporal } from "@js-temporal/polyfill";
export enum Mode {
  Last30Days,
  LastYear,
  AdrianMethod,
}
export interface MemberActivity {
  user_id: string;
  team_id: string;
  username: string;
  is_primary_owner: boolean;
  is_owner: boolean;
  is_admin: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_invited_member: boolean;
  is_invited_guest: boolean;
  messages_posted_in_channel: number;
  reactions_added: number;
  days_active: number;
  days_active_desktop: number;
  days_active_android: number;
  days_active_ios: number;
  files_added_count: number;
  days_active_apps: number;
  // days_active_workflows: number;
  // days_active_slack_connect: number;
  // total_calls_count: number;
  // slack_calls_count: number;
  slack_huddles_count: number;
  // search_count: number;
  // is_billable_seat: boolean;
  messages_posted: number;
  date_claimed: number;
  date_last_active: number;
  date_last_active_ios: number;
  date_last_active_android: number;
  date_last_active_desktop: number;
  // slack_huddles_count: z.number().nonnegative(), Always 0 on non-Enterprise plans
}
export interface AnalyticsResult {
  ok: boolean;
  num_found: number;
  member_activity: MemberActivity[];
}

export async function fetchAnalyticsData(
  //   username: string,
  xoxc: string,
  xoxd: string,
  workspace: string,
  mode: Mode = Mode.Last30Days,
): Promise<AnalyticsResult> {
  const formData = new FormData();
  formData.append("token", xoxc);
  if (mode === Mode.Last30Days) {
    // Last30Days handles only the last 30 days
    console.log(`[DEBUG] Fetching analytics data for the last 30 days.`);
    formData.append("date_range", "30d");
  } else {
    // For other modes (e.g., LastYear), calculate start and end dates
    const currentDate = Temporal.Now.plainDateISO();
    const oneWeekAgo = currentDate.subtract({ weeks: 1 });
    const startDate = oneWeekAgo.subtract({ years: 1 });

    // Subtract 4 days from both startDate and oneWeekAgo
    const adjustedEndDate = oneWeekAgo.subtract({ days: 4 });
    const adjustedStartDate = startDate.subtract({ days: 4 });

    const formattedEndDate = adjustedEndDate.toString();
    const formattedStartDate = adjustedStartDate.toString();

    console.log(
      `[DEBUG] Fetching analytics data from ${formattedStartDate} to ${formattedEndDate}`,
    );

    formData.append("start_date", formattedStartDate);
    formData.append("end_date", formattedEndDate);
  }
  formData.append("count", "1");
  formData.append("sort_column", "messages_posted");
  formData.append("sort_direction", "desc");
  //   formData.append("query", username);
  formData.append("count", "5000");

  const authCookie = `d=${xoxd}`;
  const response = await fetch(
    `https://${workspace}.slack.com/api/admin.analytics.getMemberAnalytics`,
    {
      method: "POST",
      body: formData,
      headers: {
        Authority: `${workspace}.slack.com`,
        Cookie: authCookie, // We don't really need anything fancy here.
      },
    },
  );
  const text = await response.text();
  //   console.log(text)
  const json = JSON.parse(text);
  //   console.log(json)
  const data = json as AnalyticsResult;
  //   if (!data.ok) {
  //     throw new Error("Failed to fetch analytics data");
  //   }
  //   if (data.num_found > 1) {
  //     console.warn(`[WARN] Found ${data.num_found} users`);
  //   }
  //   const member = data.member_activity.find(
  //     (member) => member.username === username
  //   );

  //   if (!member) {
  //     throw new Error(`User ${username} not found`);
  //   }

  //   return member;
  return data;
}
