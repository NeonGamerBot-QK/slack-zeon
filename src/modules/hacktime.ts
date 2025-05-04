import { ModifiedApp } from "./slackapp";
import ms from "ms";
export interface RootInterface0 {
  data: Data;
}

export interface Data {
  username: string;
  user_id: string;
  is_coding_activity_visible: boolean;
  is_other_usage_visible: boolean;
  status: string;
  start: string;
  end: string;
  range: string;
  human_readable_range: string;
  total_seconds: number;
  daily_average: number;
  human_readable_total: string;
  human_readable_daily_average: string;
  projects: Project[];
}

export interface Project {
  name: string;
  total_seconds: number;
  text: string;
  hours: number;
  minutes: number;
  percent: number;
  digital: string;
}
export function getStatusBar() {
  const today = new Date();
  if (today.getDate() > 1) today.setDate(today.getDate() - 1);
  return fetch(
    `https://hackatime.hackclub.com/api/v1/users/U07L45W79E1/stats?start_date=${today.toISOString().split("T")[0]}&features=projects&end_date=${new Date().toISOString().split("T")[0]}`,
    {
      // headers: {
      //   Authorization: `Basic ${process.env.ENC_HACKTIME_TOKEN}`,
      // },
    },
  )
    .then((r) => r.json())
    .then((d) => (d as RootInterface0).data);
}
function isWithinLastTwoMinutes(timestamp) {
  if (timestamp instanceof Date) timestamp = timestamp.getTime();
  const currentTime = Date.now(); // Get the current timestamp in milliseconds
  const twoMinutesInMilliseconds = 2 * 60 * 1000; // 2 minutes in milliseconds

  return currentTime - timestamp <= twoMinutesInMilliseconds;
}

export function watchForWhenIUseHacktime(app: ModifiedApp) {
  // inline function lol
  const its_late_at_night =
    new Date().getHours() >= 20 && new Date().getHours() <= 6;
  function getMessage(type: string, ops?: any) {
    switch (type) {
      case "new":
        if (app.is_at_school) {
          return `Well Well Well <@${process.env.MY_USER_ID}>, your coding *${ops.d.project}* looks like (you better not get caught istg getting expelled is not IT!)...`;
        } else if (its_late_at_night) {
          return `Well Well Well <@${process.env.MY_USER_ID}>, your coding *${ops.d.project}* looks like (its late at night gts dumbass)...`;
        } else {
          return `Well Well Well <@${process.env.MY_USER_ID}>, your coding *${ops.d.project}* looks like...`;
        }
        break;
      case "active":
        if (app.is_at_school) {
          return `Hey <@${process.env.MY_USER_ID}>, are you still coding? LOCK IN NEON smh. those grades aint going up themselves.`;
        } else if (its_late_at_night) {
          return `Hey <@${process.env.MY_USER_ID}>, are you still coding? are you finally eepy neon?`;
        } else {
          return `Hey <@${process.env.MY_USER_ID}>, are you still coding? if not its about to be cancled.`;
        }
        break;
      case "over":
        if (app.is_at_school) {
          return `Looks like your done coding rn <@${process.env.MY_USER_ID}>, you coded for a total of ${ms(Date.now() - ops.currentSession.created_at)}\n> now focus on ur school work`;
        } else if (its_late_at_night) {
          return `Looks like your done coding rn <@${process.env.MY_USER_ID}>, you coded for a total of ${ms(Date.now() - ops.currentSession.created_at)}\n> now good night neon`;
        } else {
          return `Looks like your done coding rn <@${process.env.MY_USER_ID}>, you coded for a total of ${ms(Date.now() - ops.currentSession.created_at)}`;
        }
    }
  }
  // ok since i use terminal im gonna make it ignore that, otherwise its a copy of my other code
  setInterval(async () => {
    try {
      const userHacktimeDat = await fetch(
        `https://waka.hackclub.com/api/compat/wakatime/v1/users/${process.env.MY_USER_ID}/heartbeats?date=${new Date().toISOString().split("T")[0]}`,
        {
          headers: {
            Authorization: `Basic ${process.env.ENC_HACKTIME_TOKEN}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      )
        .then((r) => r.json())
        .then((r) => r.data);
      const currentSession = app.db.get(`hackedhearts`);
      if (userHacktimeDat.length > 0) {
        const d = userHacktimeDat
          .filter((e) => e.category === "coding" && e.project !== "Terminal")
          .find((e) =>
            isWithinLastTwoMinutes(new Date(e.created_at).getTime()),
          );
        // console.log(d);
        if (d) {
          // console.log(0);
          // console.log(`um heartbat???`, d)
          if (!currentSession) {
            app.client.chat
              .postMessage({
                channel: `C07R8DYAZMM`,
                text: getMessage("new", { d, currentSession }),
              })
              .then((d) => {
                //  heartStore.set(user.user, {
                //      active: true,
                //      m_ts: d.ts,
                //      created_at: Date.now()
                //  })
                app.db.set(`hackedhearts`, {
                  active_index: 0,
                  m_ts: d.ts,
                  created_at: Date.now(),
                });
              });
          } else {
            app.db.set("hackedhearts", {
              ...currentSession,
              active_index: -1,
              // ...currentSession,
            });
          }
        } else {
          console.debug(1);
          if (currentSession) {
            // check if still "active"
            if (
              currentSession.active_index < 0 &&
              currentSession.active_index > -5
            ) {
              // set to not be active
              // pretty much this is a warning: if there is no new heartbeat im nuking it.
              console.log("hmmm");
              app.db.set("hackedhearts", {
                ...currentSession,
                active_index: currentSession.active_index - 1,
                // ...currentSession,
              });
              if (currentSession.active_index == -1) {
                app.client.chat.postMessage({
                  channel: `C07R8DYAZMM`,
                  text: getMessage("active", { d, currentSession }),
                  thread_ts: currentSession.m_ts,
                  // reply_broadcast: true
                });
              }
            } else {
              console.log("over");
              // send time up message
              app.client.chat.postMessage({
                channel: `C07R8DYAZMM`,
                text: getMessage("over", { d, currentSession }),
                thread_ts: currentSession.m_ts,
                reply_broadcast: true,
              });
              // delete it
              //  heartStore.delete(user.user)
              app.db.delete(`hackedhearts`);
            }
          }
        }
      }
    } catch (e) {
      console.error(e, `fucking hackatime`);
    }
    // console.log(userHacktimeDat)
  }, 1000 * 60);
}
