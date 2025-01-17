import { MemberActivity } from "./getSlackAnalytics";
export interface SlackDbEntry {
  msgCount: number;
  nonChannelMessages: number;
  userID: string;
  is_admin: boolean;
  is_guest: boolean;
  is_using_android: boolean;
  is_using_ios: boolean;
  is_using_desktop: boolean;
  daysActive: number;
  last_login: string;
  timeRecorded: number;
}
export function formatSlackBadge(entry: SlackDbEntry): string {
  let str = "";
  if (entry.is_admin) str += `:tw_shield: `;
  if (entry.is_guest) str += `:eyes: `;
  if (entry.is_using_android) str += `:android: `;
  if (entry.is_using_ios) str += `:iphone: `;
  if (entry.is_using_desktop) str += `:laptopparrot:  `;
  return str.trimEnd();
}
export function diffSlackLB(oldLB: SlackDbEntry[], newLB: SlackDbEntry[]) {
  const msgs = [];
  for (const entry of newLB) {
    const oldEntry = oldLB.find((e) => e.userID === entry.userID);
    if (!oldEntry) {
      msgs.push(
        `:yay: <@${entry.userID}> Welcome to the leaderboard joining us in #${
          newLB.indexOf(entry) + 1
        } place with 💬 \`${entry.msgCount}\` msgs. tags: ${formatSlackBadge(entry)}`,
      );
      continue;
    }

    const diff = entry.msgCount - oldEntry.msgCount;
    // console.log(diff, entry.msgCount, oldEntry.msgCount)
    let newRankMessage =
      newLB.indexOf(entry) !== oldLB.findIndex((e) => e.userID == entry.userID)
        ? newLB.indexOf(entry) -
            oldLB.findIndex((e) => e.userID == entry.userID) >
          0
          ? `You have moved down to #${newLB.indexOf(entry) + 1} from #${oldLB.findIndex((e) => e.userID == entry.userID) + 1} -- diff of ${newLB.indexOf(entry) - oldLB.findIndex((e) => e.userID == entry.userID)}, o: ${oldLB.findIndex((e) => e.userID == entry.userID)}, n: ${newLB.indexOf(entry)}  (debug)`
          : `You have moved up to #${newLB.indexOf(entry) + 1} from #${oldLB.findIndex((e) => e.userID == entry.userID) + 1} -- diff of ${newLB.indexOf(entry) - oldLB.findIndex((e) => e.userID == entry.userID)}, o: ${oldLB.findIndex((e) => e.userID == entry.userID)}, n: ${newLB.indexOf(entry)} (debug)`
        : ``;
    if (diff > 0) {
      msgs.push(
        `${newRankMessage ? (newRankMessage.includes("up") ? ":upvote:" : ":downvote:") : ""}:yay: ${entry.userID} (${formatSlackBadge(entry)})  You have gained \`${diff}\` 💬. ${newRankMessage ?? "No rank change"}`,
      );
    } else if (diff < 0) {
      msgs.push(
        `${newRankMessage ? (newRankMessage.includes("up") ? ":upvote:" : ":downvote:") : ""}:noooovanish: ${entry.userID}  (${formatSlackBadge(entry)}) You lost \`${Math.abs(diff)}\` 💬. ${newRankMessage ?? "No rank change"}`,
      );
    }
  }
  return msgs;
}
