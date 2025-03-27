import dayjs from "dayjs";
import ms from "ms";
import { ModifiedApp } from "./slackapp";
export interface FlightData {
  flight: Flight;
  flightPosition: FlightPosition[];
  route: Location[];
  update: string;
  deeplink: string;
}

export interface FlightPosition {
  latitude: number;
  longitude: number;
  heading: number;
}

export interface Flight {
  id: string;
  departure: Departure;
  arrival: Arrival;
  airline: Airline;
  flight_number: string;
  status: string;
  equipment: Equipment;
  distance: number;
}

export interface Equipment {
  modelId: string;
  tail_number: string;
  model_name: string;
  features: any[];
  range: number;
  cruising_speed: number;
  model_iata: string;
  model_icao: string;
  first_flight: number;
  age: number;
  countryCode: string;
  manufacturer: string;
}

export interface Airline {
  id: string;
  name: string;
  iata: string;
  icao: string;
  website: string;
  twitter: string;
  callsign: string;
  phone: string;
  facebook: string;
  alliance: string;
  active: boolean;
  relevance: number;
  created: number;
  last_updated: number;
  content_type: string;
}

export interface Arrival {
  scheduled_airport: Airport;
  actual_airport: Airport;
  gate: string;
  schedule: Schedule;
  weather: Weather;
  airportDelays: AirportDelays;
}

export interface Weather {
  temperature: number;
  condition: number;
  night: boolean;
}

export interface Departure {
  airport: Airport;
  terminal: string;
  gate: string;
  schedule: Schedule;
  faaTerminalConstraints: FaaTerminalConstraints;
  airportDelays: AirportDelays;
  checkInSchedule: CheckInSchedule;
}

export interface CheckInSchedule {
  open: number;
  close: number;
}

export interface AirportDelays {
  averageDelayMinutes: number;
  lastUpdated: number;
  expirationTime: number;
  trend: string;
}

export interface FaaTerminalConstraints {
  constraints: string[];
  expirationTime: number;
}

export interface Schedule {
  gate: Gate;
  runway: Gate;
  initialGateTime: number;
}

export interface Gate {
  original: number;
  actual: number;
  estimated: number;
}

export interface Airport {
  id: string;
  name: string;
  full_name: string;
  iata: string;
  icao: string;
  timezone: string;
  location: Location;
  city: string;
  country: string;
  countryCode: string;
  region: string;
  relevance: number;
  created: number;
  last_updated: number;
  content_type: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export function getFlightData(flightId: string): Promise<Flight> {
  return new Promise(async (res) => {
    const cheerio = await import("cheerio");
    const text = await fetch("https://live.flighty.app/" + flightId).then((r) =>
      r.text(),
    );
    const $ = cheerio.load(text);
    for (const script of $("script")) {
      const text = $(script).text();
      if (text.includes("var flight ")) {
        console.log(text.split("var flight = ")[1].split("\n")[0].trim());
        const flight = JSON.parse(
          text.split("var flight = ")[1].split("\n")[0].trim().replace(";", ""),
        );
        // console.log(typeof flight )
        //@ts-ignore
        const flightD = flight.flight as Flight;
        res(flightD);
        break;
        // console.log(JSON.stringify(flight)
      }
    }
  });
}
function detectChanges(newData, previousData) {
  if (!previousData) {
    console.log("Initial flight data loaded.");
    // previousData = newData;
    return [];
  }

  let changes = [];
  function compareObjects(oldObj, newObj, path = "") {
    for (let key in newObj) {
      let newPath = path ? `${path}.${key}` : key;
      if (typeof newObj[key] === "object" && newObj[key] !== null) {
        compareObjects(oldObj[key] || {}, newObj[key], newPath);
      } else if (oldObj[key] !== newObj[key]) {
        changes.push(`${newPath}: ${oldObj[key]} → ${newObj[key]}`);
      }
    }
  }

  compareObjects(previousData, newData);

  if (changes.length > 0) {
    return changes;
    console.log("Flight data changed:");
    console.log(changes.join("\n"));
  } else {
    // console.log("No changes detected.");
  }

  // previousData = newData;
}

export async function cronForTrackingData(app: ModifiedApp) {
  const IdsToTrack = app.dbs.flightly.get("flightly-ids");
  for (const { flightId, userId } of IdsToTrack) {
    const flightD = await getFlightData(flightId);
    const changes = await detectChanges(flightD, app.dbs.flightly.get(userId));
    if (changes.length > 0) {
      await app.client.chat.postMessage({
        channel: userId,
        text: changes.join("\n"),
      });
    }
    app.dbs.flightly.set(userId, flightD);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
export async function getTextVersionOfData(flightId: string) {
  const flightD = await getFlightData(flightId);
  return `
  ${flightD.airline.name} ${flightD.flight_number} on ${new Date(flightD.arrival.schedule.gate.estimated * 1000).toISOString().split("T")[0]}
  ${flightD.departure.airport.city} to ${flightD.arrival.actual_airport.city}
  funny arrow here: ${dayjs(flightD.departure.schedule.runway.estimated * 1000).format("h:mm A Z")} UTC
  not so funny arrow here: ${dayjs(flightD.arrival.schedule.runway.estimated * 1000).format("h:mm A Z")} UTC
  
  Flight length: ${ms(1000 * Math.abs(flightD.departure.schedule.runway.estimated - flightD.arrival.schedule.runway.estimated))}
  
  Arriving at Terminal ${0} - Gate ${flightD.arrival.gate} at  ${dayjs(flightD.arrival.schedule.runway.estimated * 1000).format("h:mm A Z")} UTC
  Updates: https://live.flighty.app/${flightD.id}
         `;
}
