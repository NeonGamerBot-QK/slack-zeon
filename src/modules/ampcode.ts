export function getHtmlText() {
  return fetch("https://ampcode.com/workspaces/hackclub", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "if-none-match": '"yfqz1r"',
      priority: "u=0, i",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      cookie: process.env.NEON_AMP_COOKIE,
    },
  }).then(async (r) => {
    return {
      status: r.status,
      text: await r.text(),
    };
  });
}
export function extractJson(html: string) {
  const match = html.match(/data: (\[[\s\S]*?\]),\s*form:/);
  if (!match) {
    console.error("Could not find data");
    return null;
    // process.exit(1);
  }

  const dataStr = match[1]
    .replace(/new Date\((\d+)\)/g, "$1")
    .replace(/\(function\(a\)\{[\s\S]*?\}\)\(\{\}\)/g, "{}");

  const data = eval("(" + dataStr + ")");
  if (!data) return null;
  return data;
}

export async function getAmpBalance() {
  const ampReq = await getHtmlText();
  if (ampReq.status !== 200) return null;
  const json = extractJson(ampReq.text);
  const credits = json[3]?.data?.credits;
  const currentBalance = credits?.available; // 93253.2
  const totalTokens = credits?.used + credits?.available; // 6735.1 + 93253.2 = 99988.3
  const usedTokens = credits?.used; // 6735.1
  return `current: ${currentBalance}, total: ${totalTokens}, used: ${usedTokens}`;
}
