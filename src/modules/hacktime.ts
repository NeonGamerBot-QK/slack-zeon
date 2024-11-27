import { ModifiedApp } from "./slackapp";
import ms from "ms";
export function getStatusBar() {
  return fetch(
    "https://waka.hackclub.com/api/users/U07L45W79E1/statusbar/today",
    {
      headers: {
        Authorization: `Basic ${process.env.ENC_HACKTIME_TOKEN}`,
      },
    },
  )
    .then((r) => r.json())
    .then((d) => d.data.projects);
}
function isWithinLastTwoMinutes(timestamp) {
  if(timestamp instanceof Date) timestamp = timestamp.getTime();
  const currentTime = Date.now(); // Get the current timestamp in milliseconds
  const twoMinutesInMilliseconds = 2 * 60 * 1000; // 2 minutes in milliseconds

  return (currentTime - timestamp) <= twoMinutesInMilliseconds;
}

export function watchForWhenIUseHacktime(app: ModifiedApp) {
  // ok since i use terminal im gonna make it ignore that, otherwise its a copy of my other code
  setInterval(async() => {
    const userHacktimeDat = await fetch(`https://waka.hackclub.com/api/compat/wakatime/v1/users/${process.env.MY_USER_ID}/heartbeats?date=${new Date().toISOString().split('T')[0]}`, {
      headers: {
        Authorization: `Basic ${process.env.ENC_HACKTIME_TOKEN}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
      }
  }).then(r=>r.json()).then(r=>r.data)
  const currentSession = app.db.get(`hackedhearts`)
  if(userHacktimeDat.length > 0) {
    const d  = userHacktimeDat.find(e => isWithinLastTwoMinutes(new Date(e.created_at)))
     if(d) {
       console.log(0)
// console.log(`um heartbat???`, d)
if(!currentSession) { 
app.client.chat.postMessage({
 channel: `C07R8DYAZMM`,
 text: `Well Well Well <@${process.env.MY_USER_ID}>, your coding it looks like...`
}).then(d=> {
//  heartStore.set(user.user, {
//      active: true,
//      m_ts: d.ts,
//      created_at: Date.now()
//  })
app.db.set(`hackedhearts`, {
     active: true,
     m_ts: d.ts,
     created_at: Date.now()
})
})
} 
}
  else {
    console.debug(1)
     if(currentSession) {
         // check if still "active"
         if(currentSession.active) {
// set to not be active
// pretty much this is a warning: if there is no new heartbeat im nuking it.
console.log("hmmm")
           app.db.set("hackedhearts", {
     active: false,
    ...currentSession,
})
         } else{
           console.log("over")
             // send time up message
             app.client.chat.postMessage({
                 channel: `C07R8DYAZMM`,
                 text: `Looks like your done coding rn <@${process.env.MY_USER_ID}>, you coded for a total of ${ms(Date.now() - currentSession.created_at)}`,
                 thread_ts: currentSession.m_ts,
                 reply_broadcast: true
             })
             // delete it
            //  heartStore.delete(user.user)
            app.db.delete(`hackedhearts`)
         }
     }
    }
  }
  // console.log(userHacktimeDat)
  }, 1000 * 60)
}
