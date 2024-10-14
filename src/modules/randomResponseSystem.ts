export const  acRandom =  [
    "It might be {hour} but i COULD be tweaking", 
    "hello today, my name is ~markiplier~ zeon.",
    "Wana break from the ads, tap now because YOU can get spotify premium",
    "Counterspell about to be lit (yes)",
    "Um uh im a robot.",
    "do NOT star this message", 
    "Start this message",
    "Blahaj :blahaj: ",
    "Blahaj :blahaj1: ",
    "Blahaj :blahaj2: ",
    "Blahaj (spinny) :blahaj-spin: ",
    ]
export function actualRandomResponse() {
    return parseRandom(acRandom[Math.floor(Math.random() * acRandom.length)])
}
export function parseRandom(str: string): string {
    //@ts-ignore
    return str.replaceAll("{hour}", "-1")
}
export function getResponse():string {
    // add stuff from MY messages (not others)
    // then decrypt what im saying
    // if unrelevent this should be last fyi, send random stuff
    return actualRandomResponse();
}