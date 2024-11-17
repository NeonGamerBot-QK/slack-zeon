export default function getStatusBar() {
    return fetch("https://waka.hackclub.com/api/users/U07L45W79E1/statusbar/today", {
        headers: {
            Authorization: `Basic ${process.env.ENC_HACKTIME_TOKEN}`
        }
    }).then(r=>r.json()).then(d => d.data.projects)
}