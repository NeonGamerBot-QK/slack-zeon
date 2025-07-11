export * as BaseCommand from "./BaseCommand";
export * as CommandLoader from "./CommandLoader";
export * as Status from "./status";
export * as Random from "./randomResponseSystem";
export * as howWasYourDay from "./howWasYourDay";
// export * from "./wsDirectory";
// export * from "./smee";
export * as whatYouDo from "./projectWaterydo";
// export * as songs from "./Songs";
export * as hacktime from "./hacktime";
export * as adventOfCode from "./adventofcode";
export * as hcshipments from "./parseShipments";
export * as hackclubcdn from "./hackclubcdn";
export * as bdayutils from "./bday";
export * as tempmail from "./TempHackclubEmail";
export * as irl from "./watchMyIrl";
export * as hangman from "./hangman";
//export * as highseas from "./highseas";
export * as school from "./school";
export * as daysofcode15 from "./15daysofcode";
export * as shipwrecked from "./shipwrecked";
export * as yswsdb from "./theyswsdb";
// @see https://github.com/hackclub/librarian/blob/main/utils/channelManagers.js
export async function getChannelManagers(channel) {
  const myHeaders = new Headers();
  myHeaders.append("Cookie", `d=${process.env.SLACK_USER_COOKIE}`);

  const formdata = new FormData();
  formdata.append("token", process.env.SLACK_BROWSER_TOKEN);
  formdata.append("entity_id", channel);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: formdata,
    redirect: "follow",
  };

  const request = await fetch(
    "https://slack.com/api/admin.roles.entity.listAssignments",
    //@ts-ignore
    requestOptions,
  );

  const json = await request.json();
  // console.log(json.role_assignments)
  if (!json.ok) return [];
  return json.role_assignments[0]?.users || [];
}
