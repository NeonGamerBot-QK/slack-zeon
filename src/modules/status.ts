interface NowPlayingItem {
  ChannelId?: string;
  id: string;
  HasSubtitles: boolean;
  Path: string;
  OriginalTitle?: string;
  Name: string;
  Type: "Movie" | "Episode" | string;
  SeriesName?: string;
  UserName: string;
}
interface JellyfinSession {
  // not fully typed cuz i dont have allat time
  NowPlayingItem?: NowPlayingItem;
}
export function parseSeriesName(name: string): string {
  // sometimes my series names are messy if so run code else return str
  if (name.indexOf(" ") > 0) return name;
  let mname: string[] = name.split(".");
  mname = mname.filter(
    (d) => !(d.toLowerCase() == "dub" || d.toLowerCase() == "sub"),
  );
  name = mname.join(" ");
  return name;
}
export async function getJellyfinStatus(): Promise<string | null> {
  try {
    const jellyfinData = await fetch(
      process.env.MY_JELLYFIN_INSTANCE + "/Sessions?active=true",
      {
        headers: {
          "X-Emby-Token": process.env.MY_JELLYFIN_TOKEN || "no",
        },
      },
    ).then((r) => r.json());
    const mySession = jellyfinData.find(
      (d) => d.NowPlayingItem,
    ) as JellyfinSession;
    if (!mySession) return null;
    if (mySession.NowPlayingItem.UserName !== "Neon") return null;
    const type = mySession.NowPlayingItem.Type;
    const isMovie = type === "Movie";

    if (!(type in { Movie: 1, Episode: 1 })) return null;
    const title = isMovie
      ? mySession.NowPlayingItem.Name
      : `${mySession.NowPlayingItem.SeriesName} - ${parseSeriesName(mySession.NowPlayingItem.Name)}`;

    let str = `${isMovie ? "🍿" : ""}📺️ ${title}`;
    return str;
  } catch (e: any) {
    return `:x: ${e.message}`;
  }
}
export async function getSpotifyStatus(): Promise<string | null> {
  // contact zeon (me) discord version for spotify status
  return await fetch(process.env.ZEON_DISCORD_INSTANCE + "/spotify/status", {
    method: "GET",
    headers: {
      Authorization: process.env.AUTH,
    },
  })
    .then((r) => r.json())
    // to find out what it is you gotta find it on slack :P
    .then((r) => r.str);
}

// schema
