import { ModifiedApp } from "./slackapp";

// time to get fudge pt 2
export interface UserSystem {
    username: string;
    days: string[];
}
export function parseTextAndExtractUsers(text:string) {
    return text.split('|--------------------')[2].split('\n').filter(Boolean).map(e=>e.split("|").filter(Boolean).map(d=>d.trim().replace('✓ ', ''))).filter(e=>e.length > 1).map(d=> {
        return {
            username: d[0],
            days: d.slice(1).filter(Boolean)
        }
        }).filter(e=>!e.username.startsWith('---'))
}
export function getMetaInfo(text:string) {
    const [Rstatus, Rwrote] = text.split('-------------------\nEND OF TRANSMISSION')[1].split('---')[0].split('\n').filter(Boolean)
return {
    status: Rstatus.split(' ')[1],
    wrote: Rwrote.split(':')[1].trim()
}
}
export async function getUsers() {
    // this will take a hot sec
    const response = await fetch("https://daysinpublic.blaisee.me/").then(r=>r.text())
    return {data:parseTextAndExtractUsers(response), meta:getMetaInfo(response)}
}

export function diffStrings(oldArray: UserSystem[], newArray: UserSystem[]) {
const strings = []
    for(const user of newArray) {
    const oldUser = oldArray.find(e=>e.username === user.username)
    if(!oldUser) {
        strings.push(`✓ ${user.username} has started there first day!`)
    continue;
    }
    const daysDiffLength = user.days.length - oldUser.days.length
    if(daysDiffLength > 0) {
        strings.push(`:yay: ${user.username} has moved up to ${user.days.length + 1} days!`)
    }
}
return strings
}
export async function cronMoment(app: ModifiedApp) {
const oldData = app.db.get('15daysofcode') || []
const {data} = await getUsers()
const strings = diffStrings(oldData, data)
app.db.set('15daysofcode', data)
if(strings.length > 0) {
// diff moment
app.client.chat.postMessage({
    channel: `C045S4393CY`,
    thread_ts: `1740283783.721689`,
    text: `Diff for \`${new Date().toISOString()}\` (EST)\n\n${strings.join('\n')}`
})
}
}