import ical from "node-ical";
export const getIcalParsedData = () =>
  fetch(process.env.HW_URL)
    .then((r) => r.text())
    .then((data) => ical.sync.parseICS(data));
export async function getEventsForDate(today) {
  //   const today = new Date('11-01-2024');
  const directEvents = await getIcalParsedData();
  // console.debug(directEvents)
  //@ts-ignore
  const events = Object.values(directEvents)
    .filter((e) => e.method == "PUBLISH" && e.type == "VEVENT")
    .filter((e) => {
      //@ts-ignore
      const start = new Date(e.start);
      //@ts-ignore
      const end = new Date(e.end);
      if (
        start.getDate() == today.getDate() &&
        start.getMonth() == today.getMonth() &&
        start.getFullYear() == today.getFullYear() &&
        end.getDate() == today.getDate() &&
        end.getMonth() == today.getMonth() &&
        end.getFullYear() == today.getFullYear()
      ) {
        //@ts-ignore
        e.assign_type = "startend";
        return true;
      }
      if (
        end.getDate() == today.getDate() &&
        end.getMonth() == today.getMonth() &&
        end.getFullYear() == today.getFullYear()
      ) {
        //@ts-ignore
        e.assign_type = "end";
        return true;
      }
      if (
        start.getDate() == today.getDate() &&
        start.getMonth() == today.getMonth() &&
        start.getFullYear() == today.getFullYear()
      ) {
        //@ts-ignore
        e.assign_type = "start";
        return true;
      }
      return false;
    });
  return events;
}

export async function getTodaysEvents() {
  const today = new Date();
  const events = await getEventsForDate(today);
  return events;
}