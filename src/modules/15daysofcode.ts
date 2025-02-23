// time to get fudge pt 2
export interface UserSystem {
    username: string;
    days: string[];
}
export function parseTextAndExtractUsers(text:string) {
    return text.split('|--------------------')[2].split('\n').filter(Boolean).map(e=>e.split("|").filter(Boolean).map(d=>d.trim().replace('✓ ', ''))).filter(e=>e.length > 1).map(d=> {
        return {
            username: d[0],
            days: d.slice(1)
        }
        })
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

