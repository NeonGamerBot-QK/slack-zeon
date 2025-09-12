import { Cron } from "croner";

export interface HTNEventScheduleResponse {
    data: Data;
}

export interface Data {
    eventSchedule: EventSchedule[];
}

export interface EventSchedule {
    id: number;
    end_time: string;
    start_time: string;
    location: string;
    description?: string;
    banner_link?: any;
    tags: string[];
    title: string;
    links: any[];
    __typename: string;
}


export function buildEventBlocks(event: EventSchedule) {
    const blocks: any[] = [];

    // Optional banner image
    if (event.banner_link) {
        blocks.push({
            type: "image",
            image_url: event.banner_link,
            alt_text: event.title,
        });
    }

    // Title + time/location
    blocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*${event.title}*\n:clock1: ${formatTime(
                event.start_time,
                event.end_time
            )}\n:round_pushpin: ${event.location}`,
        },
    });

    // Optional description
    if (event.description) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: event.description,
            },
        });
    }

    // Tags
    if (event.tags?.length > 0) {
        blocks.push({
            type: "context",
            elements: event.tags.map((tag) => ({
                type: "mrkdwn",
                text: `\`${tag}\``,
            })),
        });
    }

    // Links (turn into buttons)
    if (event.links?.length > 0) {
        blocks.push({
            type: "actions",
            elements: event.links.map((link, i) => ({
                type: "button",
                text: {
                    type: "plain_text",
                    text: link.label || `Link ${i + 1}`,
                },
                url: link.url || link, // supports either { label, url } or plain string
            })),
        });
    }

    return blocks;
}

// helper: formats the times for Slack message
function formatTime(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })} – ${endDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}
async function run(app, db) {
    fetch('https://api.hackthenorth.com/v3/graphql', {
        method: 'POST',
        headers: {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'apollo-require-preflight': 'true',
            'authorization': process.env.HTN_TOKEN,
            'content-type': 'application/json',
            'origin': 'https://my.hackthenorth.com',
            'priority': 'u=1, i',
            'referer': 'https://my.hackthenorth.com/',
            'sec-ch-ua': '"Not.A/Brand";v="99", "Chromium";v="136"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Linux"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
            'operationName': 'GetEventSchedule',
            'variables': {
                'eventSlug': 'hackthenorth2025'
            },
            'query': 'query GetEventSchedule($eventSlug: String!) {\n  eventSchedule(where: {event: {is: {slug: {equals: $eventSlug}}}}) {\n    id\n    end_time\n    start_time\n    location\n    description\n    banner_link\n    tags\n    title\n    links\n    __typename\n  }\n}\n'
        })
    }).then(r => r.json()).then(async d => {
        const stuff = (d as HTNEventScheduleResponse).data
        const now = new Date()
        // below was for testing
        // now.setDate(now.getDate() + 1)
        // now.setHours(now.getHours() + 6)

        for (const event of stuff.eventSchedule) {
            const startIsntance = await db.get(`htn_event_${event.id}_start`)
            const endTick = await db.get(`htn_event_${event.id}_end`)
            const isRunningNow = new Date(event.start_time).getTime() < now.getTime() && new Date(event.end_time).getTime() > now.getTime()
            if (endTick) continue; // already ended
            if (isRunningNow) {
                if (startIsntance) {
                    continue;
                }
                console.log(event.title, new Date(event.start_time).toLocaleString(), new Date(event.end_time).toLocaleString(), event)
                const messageId = await app.client.chat.postMessage({
                    channel: `C07FLUYRNHZ`,
                    text: `Event: *${event.title}*\nLocation: *${event.location}*\nTime: *${new Date(event.start_time).toLocaleString()} - ${new Date(event.end_time).toLocaleString()}*\n\n${event.description ? event.description : ''}\n\n<https://my.hackthenorth.com/schedule|View in app>`,
                    // now blocks
                    blocks: buildEventBlocks(event)
                }).then(d => d.ts)
                // update in db that we posted the starting of this event
                await db.set(`htn_event_${event.id}_start`, messageId)
            } else if (startIsntance && !endTick) {
                // follow up to prev msg saying event has ended
                app.client.chat.postMessage({
                    channel: `C07FLUYRNHZ`,
                    thread_ts: startIsntance,
                    text: `Event *${event.title}* has ended.`,
                    reply_broadcast: true,
                })
                await db.set(`htn_event_${event.id}_end`, true)
            }
        }
    })
}

export function setupCronForHTN(app) {
    new Cron("*/15 * * * *", async () => {
        run(app, app.db)
    })
}