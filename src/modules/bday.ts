import { Cron } from "croner";
import { ModifiedApp } from "./slackapp";
import cron from "node-cron";
type BdayEntry = {
  userID: string;
  bday: string;
  Id: number;
};
export async function cronFunc(app: ModifiedApp) {
  const today = new Date();
  for (const { userID, bday } of await app.nocodb.dbViewRow
    .list("noco", "p63yjsdax7yacy4", "mgu9yv5wts3qmt2", "vwrz4wa8z4jhfo0y", {
      offset: 0,
      where: "",
    })
    .then((e) => e.list as BdayEntry[])) {
    const user = userID;
    const date = new Date(bday);
    console.debug(
      `bday: ${user}`,
      `${today.getDate()} == ${date.getDate()}`,
      `${today.getMonth()} == ${date.getMonth()}`,
    );
    if (
      date.getDate() == today.getDate() &&
      date.getMonth() == today.getMonth()
    ) {
      const age = today.getFullYear() - date.getFullYear();
      const isOver18 = age >= 18;
      // happy bday ofc
      await app.client.chat
        .postMessage({
          channel: "C07RW1666UV",
          text: `:birthday: Happy Bday <@${user}> :birthday_dino: you are ${age} years old!! ${isOver18 ? `Congrats on becoming allumani UNC` : ``}\n you can view this here: https://slack.mybot.saahild.com/bday?u=${user}\n Everyone wish them happy birthday in the :thread:`,
        })
        .then((e) => {
          // forward message to user
          app.client.chat.postMessage({
            channel: user,
            text: `Happy Bday!\n You are now ${age} years old!! ${isOver18 ? `Congrats on becoming allumani UNC` : ``}\n you can view this here: https://slack.mybot.saahild.com/bday?u=${user}`,
          });
        });
    }
  }
}

export async function renderBday(userID: string, app: ModifiedApp) {
  const userInfo = await app.client.users.info({ user: userID });
  if (userInfo.error) return `Error: ${userInfo.error}`;
  const bday = await app.nocodb.dbViewRow
    .findOne(`noco`, "p63yjsdax7yacy4", "mgu9yv5wts3qmt2", "vwrz4wa8z4jhfo0y", {
      fields: ["userID", "bday"],
      // im not tryna get sql injected..
      where: `(userID,eq,${userID.slice(0, 11)})`,
      //@ts-ignore
    })
    .then((e) => e.bday!);
  if (!bday) return `No bday found for ${userID}\n maybe you should opt-in?`;
  // currently borrowing https://github.com/NeonGamerBot-QK/myBot/blob/master/views/bday.ejs
  //todo jsx..
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Happy Bday ${userInfo.user.real_name || userInfo.user.name} turning ${new Date().getFullYear() - new Date(bday).getFullYear()} years old">
    <meta name="author" content="NeonGamerBot-QK">
    <meta property="og:title" content="Happy Bday ${userInfo.user.real_name || userInfo.user.name}">
    <meta property="og:description" content="Happy Bday ${userInfo.user.real_name || userInfo.user.name} turning ${new Date().getFullYear() - new Date(bday).getFullYear()} years old">
    <meta property="og:image" content="${userInfo.user.profile.image_512 || userInfo.user.profile.image_192}">
    <title>Happy Bday ${userInfo.user.real_name || userInfo.user.name}</title>
</head>
<style>
    @import url("https://fonts.googleapis.com/css?family=Raleway:900&display=swap");

body {
    margin: 0px;
}

#container {
    position: absolute;
    margin: auto;
    width: 100vw;
    height: 80pt;
    top: 0;
    bottom: 0;

    filter: url(#threshold) blur(0.6px);
}

#text1,
#text2 {
    position: absolute;
    width: 100%;
    display: inline-block;

    font-family: "Raleway", sans-serif;
    font-size: 80pt;

    text-align: center;

    user-select: none;
}
</style>
<script src="https://cdn.jsdelivr.net/npm/@tsparticles/confetti@3.0.3/tsparticles.confetti.bundle.min.js"></script>
<body>
    <div id="container">
<img src="${userInfo.user.profile.image_192}" style="border-radius: 50%">
        <span id="text1"></span>
        <span id="text2"></span>
    </div>
    
    <svg id="filters">
        <defs>
            <filter id="threshold">
                <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140" />
            </filter>
        </defs>
    </svg>
</body>
<script>
    // confeti effect

    (function frame() {
  confetti({
    particleCount: 2,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    // colors: colors,
  });

  confetti({
    particleCount: 2,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    // colors: colors,
  });

//   if (Date.now() < end) {
    requestAnimationFrame(frame);
//   }
})();
    const elts = {
    text1: document.getElementById("text1"),
    text2: document.getElementById("text2")
};

const texts = [
\`Happy birthday ${userInfo.user.real_name || userInfo.user.name}.  Congrats on being ${new Date().getFullYear() - new Date(bday).getFullYear()} years old\`
];

const morphTime = 1;
const cooldownTime = .5;

let textIndex = texts.length - 1;
let time = new Date();
let morph = 0;
let cooldown = cooldownTime;

elts.text1.textContent = texts[textIndex % texts.length];
elts.text2.textContent = texts[(textIndex + 1) % texts.length];

function doMorph() {
    morph -= cooldown;
    cooldown = 0;

    let fraction = morph / morphTime;

    if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
    }

    setMorph(fraction);
}

function setMorph(fraction) {
    elts.text2.style.filter = \`blur(\${Math.min(8 / fraction - 8, 100)}px)\`;
    elts.text2.style.opacity = \`\${Math.pow(fraction, 0.4) * 100}%\`;

    fraction = 1 - fraction;
    elts.text1.style.filter = \`blur(\${Math.min(8 / fraction - 8, 100)}px)\`;
    elts.text1.style.opacity = \`\${Math.pow(fraction, 0.4) * 100}%\`;

    elts.text1.textContent = texts[textIndex % texts.length];
    elts.text2.textContent = texts[(textIndex + 1) % texts.length];
}

function doCooldown() {
    morph = 0;

    elts.text2.style.filter = "";
    elts.text2.style.opacity = "100%";

    elts.text1.style.filter = "";
    elts.text1.style.opacity = "0%";
}

function animate() {
    requestAnimationFrame(animate);

    let newTime = new Date();
    let shouldIncrementIndex = cooldown > 0;
    let dt = (newTime - time) / 1000;
    time = newTime;

    cooldown -= dt;

    if (cooldown <= 0) {
        if (shouldIncrementIndex) {
            textIndex++;
        }

        doMorph();
    } else {
        doCooldown();
    }
}

animate();
</script>
</html>`;
}
export function startBdayCron(app: ModifiedApp) {
  new Cron("0 0 * * *", async () => {
    cronFunc(app);
  });
}
