import { ModifiedApp } from "./slackapp";

export async function parseHomepage() {
const text  = await fetch("https://lockin.hackclub.com/").then(r=>r.text())
return    text.split("<ul style=\"list-style: none; padding: 0;\">")[1].split("</ul>")[0].split("li>").map(e=>e.trim()).filter(Boolean).filter(e=>e !== "<").map(html => {
        const timeMatch = html.match(/<time datetime="(.*?)">(.*?)<\/time>/);
        const datetime = timeMatch ? timeMatch[1] : null;
        const duration = timeMatch ? timeMatch[2] : null;
        
        // Extract users
        const userRegex = /<img .*?alt="(.*?)'s avatar".*?src="(.*?)".*?>\s*<p .*?>(.*?)<\/p>/g;
        let users = [];
        let match;
        
        while ((match = userRegex.exec(html)) !== null) {
            users.push({ name: match[3], avatar: match[2] });
        }
            return {datetime, duration, users}
            
        })
}
export default async function onLoad(app:ModifiedApp) {
    setInterval(async () => {
        // data
        const data = await parseHomepage()
        for (const entry of data) {
            if (app.db.get(entry.datetime)) continue;
            app.db.set(entry.datetime, true)
            if (entry.users.length == 1) {
                app.client.chat.postMessage({
                    channel: "C07LEEB50KD",
                    text: `Wow... *${entry.users[0].name}* is all alone... you should join them!`
                })
            }
                app.client.chat.postMessage({
                    channel: "C07LEEB50KD",
                    text: `*${entry.users.map(u=>u.name).join(", ")}* are in a vc locking in and have been for ${entry.duration}!!`
                })
        }
}, 15 * 60 * 1000)
}
