export const acRandom = [
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
];
// used to adverties channels
export const beggingMessage = [
  "PLEASE JOIN IT RAA",
  "Its epik i swear",
  "warning: may contain extremly dead chat.",
];
// if you want to become a neighboor of this channel just dm me on slack
export const neighbors = [];
export const channelsToAdvs = [
  ...neighbors,
  "C07QWGLQUH2",
  "C07RE4N7S4B",
  "C07PGEGJ3B6",
  "C07LZ237WCF",
  "C07LEEB50KD",
];
export function actualRandomResponse() {
  return parseRandom(acRandom[Math.floor(Math.random() * acRandom.length)]);
}
export function parseRandom(str: string): string {
  Object.entries(process.env)
    .filter(([e, v]) => ["string", "number", "bigint"].includes(typeof v))
    .forEach(([key, value]) => {
      //@ts-ignore
      str = str.replaceAll(
        `{process.env.${key}}`,
        new String(value).toString(),
      );
    });
  //@ts-ignore
  return str.replaceAll("{hour}", "-1");
}
export function getResponse(): string {
  // add stuff from MY messages (not others)
  // then decrypt what im saying
  // if unrelevent this should be last fyi, send random stuff
  return actualRandomResponse();
}
