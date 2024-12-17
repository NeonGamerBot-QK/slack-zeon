import JSONdb from "simple-json-db";

export const acRandom = () => [
  "It might be {hour} but i COULD be tweaking",
  "hello today, my name is ~markiplier~ zeon.",
  "Wana break from the ads, tap now because YOU can get spotify premium",
  "Counterspell boston was amazing!!",
  "Um uh im a robot.",
  "Start this message, like a car i go vroom vroom",
  "Blahaj :blahaj: ",
  "Blahaj :blahaj1: ",
  "Blahaj :blahaj2: ",
  "Blahaj (spinny) :blahaj-spin: ",
  ":notcool::notcool::notcool:\n> https://hackclub.slack.com/archives/C07FDHUL50F/p1728928832148439",
  // static AI
  "Hello today, my name is ~zeon~ the absolute meme lord.",
  "Want to skip the ads? Tap here, because YOU could be living your best life with unlimited cat memes!",
  "Um uh, I’m a robot… but my Wi-Fi signal is still stronger than yours.",
  "Do NOT star this message. Unless you secretly love me. In that case, go ahead.",
  "Blahaj :blahaj: because who doesn’t want a 10-foot plush shark in their life?",
  "Blahaj :blahaj1: the prototype. Slightly less fluffy, but still a legend.",
  "Blahaj :blahaj2: the sequel. Bigger. Better. Sharkier.",
  "Blahaj (spinny) :blahaj-spin: because sometimes life just needs to be chaotic and spinny.",
  "It might be {?:?? AM} but I COULD be assembling a blanket fort to defend against rogue potatoes.",
  "Um uh, I’m a robot who only understands 80s synthwave and the language of potatoes.",
  "Neon time to flex the blahaj (if its not night & ur at home)",
];

// used to adverties channels
export const beggingMessage = [
  "PLEASE JOIN IT RAA",
  "Its epik i swear",
  "warning: may contain extremly dead chat.",
  "PLEASE PLEASE PLZ PLZPLZ",
];
// if you want to become a neighboor of this channel just dm me on slack or add your self to the canvas
export const neighbors = [
  "C06R5NKVCG5",
  "C04H0MG1BLN",
  "C07SLT702UA",
  "C074L3A4C3E",
  "C0793T42XV4",
  "C07S1QSSKTQ",
  "C07RQ6682N8",
  "C080NCDAVNH",
  "C064DNF64LU",
];
// dont dupe channels :P
export const channelsToAdvs = [
  ...new Set([
    ...neighbors,
    "C07QWGLQUH2", // kcd-lunch
    "C07RE4N7S4B", // hackclub-spotify-bot
    "C07PGEGJ3B6", // hackclub-verification
    "C07LZ237WCF", // nest-pgp-chat
    "C07LEEB50KD", // zeon-public
    "C07STMAUMTK", //hackclub-ai-faq-bot
    "C07RW1666UV", //zeon-bdays
    "C080G5TM3A4", // capture-the-flag
    "C080T3WUTK4", // discord-dataming
    "C07UNAHD9C3", // stickers-watcher
    "C07TKPC0ZNZ", // surakku
    "C07V6F1A5FH", // web bridge slack
    "C07MLF9A8H5", // riceathon
  ]),
];
export function actualRandomResponse() {
  return parseRandom(acRandom()[Math.floor(Math.random() * acRandom().length)]);
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
  return str.replaceAll("{hour}", new Date().getHours());
}
// all odds are out of 100
function isItMyChance(odds = 10) {
  return Math.round(Math.random() * 100) < odds;
}
export let last_type = null;
enum ResponseTypes {
  ChannelAdvs,
}
export async function checkOverSpending(db: JSONdb) {
  let currentTransactions = await fetch(
    process.env.ZEON_DISCORD_INSTANCE + "/irl/transactions",
    {
      headers: {
        Authorization: process.env.IRL_AUTH,
      },
    },
  )
    .then((r) => r.json())
    .then((json) => json.currentTransactions);
  let sliceIndex = db.get("overspending_index") || 0;
  currentTransactions = currentTransactions.slice(sliceIndex);
  if (currentTransactions.length > 0) {
    const firstTransaction = currentTransactions[0];
    db.set("overspending_index", sliceIndex + 1);
    return `Wow, you have spent so much money today, (${firstTransaction.amount}) (${Math.round(Math.random()) ? "fatass" : "bigback"}-)`;
  }
  return false;
}
export async function getResponse(db: JSONdb): Promise<string> {
  let chanceOfChannelAdvs = isItMyChance(20);
  const overSpending = await checkOverSpending(db);
  if (overSpending) return overSpending;
  if (chanceOfChannelAdvs && last_type !== ResponseTypes.ChannelAdvs) {
    const chosenChannel =
      channelsToAdvs[Math.floor(Math.random() * channelsToAdvs.length)];
    last_type = ResponseTypes.ChannelAdvs;
    return `You should join <#${chosenChannel}> as well (${beggingMessage[Math.floor(Math.random() * beggingMessage.length)]})`;
  }
  // add stuff from MY messages (not others)
  // then decrypt what im saying
  // if unrelevent this should be last fyi, send random stuff
  return actualRandomResponse();
}
