//@ts-nocheck
/// tst tsh suysttstststtstststststst
// mail.hackclub.com

import { ModifiedApp } from "./slackapp";

export interface Mail {
  id: string;
  type: string;
  path: string;
  public_url: string;
  status: string;
  tags?: string[];
  title?: string;
  created_at: string;
  updated_at?: string;
  subtype?: string;
  original_id?: string;
  tracking_number?: string;
  tracking_link?: string;
  description?: string;
  contents?: string[];
}
function formatNewMailNotification(mail) {
  return `
📬 *New Mail Received!*

*Title*: ${mail.title || "No Title"}
*ID*: ${mail.id}
*Type*: ${mail.type}${mail.subtype ? ` (${mail.subtype})` : ""}
*Status*: ${mail.status}
*Tags*: ${mail.tags?.join(", ") || "None"}

*Created At*: ${mail.created_at}
${mail.updated_at ? `*Updated At*: ${mail.updated_at}` : ""}

*Path*: ${mail.path}
*Public URL*: ${mail.public_url}

${mail.tracking_number ? `*Tracking Number*: ${mail.tracking_number}` : ""}
${mail.tracking_link ? `*Tracking Link*: ${mail.tracking_link}` : ""}
${mail.original_id ? `*Original ID*: ${mail.original_id}` : ""}

${mail.description ? `*Description*: ${mail.description}` : ""}
${mail.contents?.length ? `*Contents*:\n- ${mail.contents.join("\n- ")}` : ""}

`.trim();
}
function diffMails(oldMail, newMail) {
  const changes = [];

  const keys = new Set([...Object.keys(oldMail), ...Object.keys(newMail)]);

  keys.forEach((key) => {
    if (key === "status") return;
    const oldValue = JSON.stringify(oldMail[key]);
    const newValue = JSON.stringify(newMail[key]);

    if (oldValue !== newValue) {
      changes.push({
        key,
        old: oldMail[key],
        new: newMail[key],
      });
    }
  });

  if (changes.length === 0) {
    return "✅ No changes detected.";
  }

  return (
    `🔄 *Mail Update Detected*\n\n` +
    changes
      .map((change) => {
        return `*${change.key}*:\n- Old: ${formatValue(change.old)}\n- New: ${formatValue(change.new)}\n`;
      })
      .join("\n")
  );
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "[]";
  } else if (value === null || value === undefined) {
    return "∅";
  } else {
    return String(value);
  }
}

export async function scrapeStuff(app: ModifiedApp) {
  setInterval(async () => {
    const theMailArray = await app.db.get("mymail") || [];
    const data = await fetch("https://mail.hackclub.com/api/public/v1/mail", {
      headers: {
        Authorization: "Bearer " + process.env.HACKCLUB_MAIL_TOKEN,
      },
    })
      .catch((e) => {
        json: () => new Promise((r) => r({ mail: null }));
      })
      .then((d) => d.json())
      .then((d) => d?.mail as Mail[]);
    if (!data) return;
    for (const mail of data) {
      if (theMailArray.some((m) => m.id == mail.id)) {
        // run diff on each key
        const diff = await diffMails(
          theMailArray.find((m) => m.id == mail.id),
          mail,
        );
        if (diff !== "✅ No changes detected.") {
          await app.client.chat.postMessage({
            text: diff || "No diff",
            channel: `C08U14VQ1HP`,
          });
        }
      } else {
        // theMailArray.push(mail)
        await app.client.chat.postMessage({
          text: formatNewMailNotification(mail) || "No new mail",
          channel: `C08U14VQ1HP`,
        });
      }
    }
    await app.db.set("mymail", data);
  }, 60 * 1000);
}
