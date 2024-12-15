import { AnyBlock, Block } from "@slack/bolt";
import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
const cheerio = require("cheerio");
export function createShipmentURL(token: string, email: string) {
  return `https://shipment-viewer.hackclub.com/shipments?email=${encodeURIComponent(email)}&signature=${token}&show_ids=yep`;
}
export function requestEmailForUser() {
  // TODO
}
export function parseShipments(shipmentsURL: string): Promise<ShipmentData> {
  return new Promise((res, rej) => {
    const final = [];
    fetch(shipmentsURL)
      .then((r) => r.text())
      .then((rhtml) => {
        const $ = cheerio.load(rhtml);
        const divs = $(`[class="col-12 col-sm-6 col-md-4 col-lg-4"]`);
        for (const d of divs) {
          // console.log(d)
          const dd = $(d);
          // YYYY-MM-DD
          const addedDate = $(
            dd.find(
              `[class="card-header d-flex align-items-center justify-content-between"]`,
            ),
          )
            .text()
            .replaceAll(`on`, ``)
            .replaceAll(`fulfilled`, ``)
            .replaceAll(`added`, ``)
            .trim();
          let isDone = $(
            dd.find(
              `[class="card-header d-flex align-items-center justify-content-between"]`,
            ),
          )
            .text()
            .includes(`fulfilled`);
          const shipmentTitle = $(dd.find(`[class="card-title"]`)).text();
          const potshipProvider = $(
            Array.from($(dd.find(`[class="card-body"] > div > p`)))[0],
          );
          const potContents = $($(dd.find(`[class="card-body"] > div > ul`)));
          const potTracking = $(
            $(
              Array.from(dd.find(`p`)).find((e) =>
                $(e).text().startsWith(`tracking #`),
              ),
            ).find(`a`),
          );
          const Airtable = $(
            $(
              Array.from(dd.find(`p`)).find((e) =>
                $(e).text().startsWith(`Airtable`),
              ),
            ).find(`a`),
          );
          let airtable = null;
          let tracking = null;
          let shiprovider = null;
          let contents = null;
          if (potContents) {
            contents = Array.from(potContents.find(`li`)).map((e) =>
              $(e).text(),
            );
          }

          // console.log(potTrackingUrl.html())
          if (potTracking.html()) {
            tracking = {
              text: potTracking.text(),
              url: potTracking.attr(`href`),
            };
          }
          if (Airtable.html()) {
            airtable = {
              text: Airtable.text(),
              url: Airtable.attr(`href`),
            };
          }
          if (potshipProvider.html) {
            shiprovider = potshipProvider.text();
          }
          final.push({
            shipmentTitle,
            // shipmentsURL,
            shiprovider,
            tracking,
            isDone,
            contents,
            airtable,
            addedDate,
          });
        }
        // console.log(final)
        res(final);
      });
  });
}
export interface Shipment {
  shipmentTitle: string;
  shiprovider: string;
  tracking: {
    text: string;
    url: string;
  };
  isDone: boolean;
  contents: string[];
  airtable: {
    text: string;
    url: string;
  };
  addedDate: string;
}
export type ShipmentData = Shipment[];
export function getShipmentDiff(
  oldShipments: ShipmentData,
  newShipments: ShipmentData,
): AnyBlock[] {
  const blocks: AnyBlock[] = [];
  for (const newShipment of newShipments) {
    const oldShipment = oldShipments.find(
      (e) => e.shipmentTitle === newShipment.shipmentTitle,
    );
    if (!oldShipment) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New Shipment:*\n> ${newShipment.shipmentTitle}\n> ${newShipment.shiprovider}\n> ${newShipment.contents.join(", ")}`,
        },
      });
    } else {
      let str = `*Shipment Updated:*\n`;
      let updateCount = 0;
      if (oldShipment.isDone !== newShipment.isDone) {
        str += `> ${newShipment.shipmentTitle} is now ${newShipment.isDone ? "done" : "not done"}\n`;
        updateCount++;
      }
      if (oldShipment.shiprovider !== newShipment.shiprovider) {
        str += `> ${newShipment.shipmentTitle} is now from ${newShipment.shiprovider}\n`;
        updateCount++;
      }
      if (oldShipment.contents.join(", ") !== newShipment.contents.join(", ")) {
        str += `> ${newShipment.shipmentTitle} has new contents\n`;
        updateCount++;
      }
      if (oldShipment.tracking.text !== newShipment.tracking.text) {
        str += `> ${newShipment.shipmentTitle} has a new tracking number\n`;
        updateCount++;
      }
      if (oldShipment.airtable.text !== newShipment.airtable.text) {
        str += `> ${newShipment.shipmentTitle} has a new airtable link\n`;
        updateCount++;
      }
      if (updateCount > 0) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: str,
          },
        });
      }
    }
  }
  return blocks;
}
export function setupCronForShipments(app: ModifiedApp) {
  cron.schedule("*/2 * * * *", async () => {
    const allUsersWithAShipmentURL = Object.keys(app.db.JSON()).filter((e) =>
      e.startsWith(`shipment_url_`),
    );
    if (allUsersWithAShipmentURL.length > 0) {
      for (const userURLID of allUsersWithAShipmentURL) {
        try {
          const shipments = await app.utils.hcshipments.parseShipments(
            app.db.get(userURLID),
          );
          const oldShipments = app.db.get(
            `shipments_${userURLID.replace(`shipment_url_`, ``)}`,
          );
          //
          if (oldShipments !== shipments) {
            // run diff and uhh send stuff
            const blocks = getShipmentDiff(oldShipments, shipments);
            for (const b of blocks) {
              await app.client.chat.postMessage({
                channel: userURLID.replace(`shipment_url_`, ``),
                blocks: [b],
              });
            }
          }
          await app.db.set(
            `shipments_${userURLID.replace(`shipment_url_`, ``)}`,
            shipments,
          );
        } catch (e) {
          // coulda failed parsing or diff..
          console.error(e);
        }
      }
    }
  });
}
