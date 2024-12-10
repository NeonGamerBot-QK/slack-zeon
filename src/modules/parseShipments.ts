const  cheerio  = require('cheerio')
export function createShipmentURL(token: string, email: string) {
return `https://shipment-viewer.hackclub.com/shipments?email=${encodeURIComponent(email)}&signature=${token}&show_ids=yep`
}
export function requestEmailForUser() {
    // TODO
}
export function parseShipments(shipmentsURL: string) {
    return new Promise((res,rej) => {
    const final = []
fetch(shipmentsURL).then(r=>r.text()).then(rhtml => {
    const $ = cheerio.load(rhtml)
    const divs = ($(`[class="col-12 col-sm-6 col-md-4 col-lg-4"]`))
    for (const d of divs) {
        // console.log(d)
        const dd = $(d)
        // YYYY-MM-DD
        const addedDate = $(dd.find(`[class="card-header d-flex align-items-center justify-content-between"]`)).text().replaceAll(`on`, ``).replaceAll(`fulfilled`, ``).replaceAll(`added`, ``).trim()
        let isDone = $(dd.find(`[class="card-header d-flex align-items-center justify-content-between"]`)).text().includes(`fulfilled`)
        const shipmentTitle = $(dd.find(`[class="card-title"]`)).text()
        const potshipProvider = $(Array.from($(dd.find(`[class="card-body"] > div > p`)))[0])
        const potContents = $($(dd.find(`[class="card-body"] > div > ul`)))
const potTracking = $($(Array.from(dd.find(`p`)).find(e=>$(e).text().startsWith(`tracking #`))).find(`a`))
const Airtable = $($(Array.from(dd.find(`p`)).find(e=>$(e).text().startsWith(`Airtable`))).find(`a`))
let airtable = null;
let tracking = null
let shiprovider = null;
        let contents = null;
if(potContents) {
contents = (Array.from(potContents.find(`li`)).map(e=>$(e).text()))    
} 

        // console.log(potTrackingUrl.html())
        if(potTracking.html()) {
            tracking = {
                text: potTracking.text(),
                url: potTracking.attr(`href`)
            }
        }
        if(Airtable.html()) {
            airtable = {
                text: Airtable.text(),
                url: Airtable.attr(`href`)
            }
        }
        if(potshipProvider.html) {
            shiprovider = potshipProvider.text()
        }
        final.push({
            shipmentTitle,
            shipmentsURL,
            shiprovider,
            tracking,
            isDone,
            contents,
            airtable,
            addedDate
        })

    }
// console.log(final)
res (final)
})
})
}