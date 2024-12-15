export default function watchLocation() {
  const location = null;
  // todo
}

export function watchBattery() {
  fetch(process.env.ZEON_DISCORD_INSTANCE! + "/irl/locations", {
    // auth etcc
    // iff batt under 100, send message if not already sent
  })
}