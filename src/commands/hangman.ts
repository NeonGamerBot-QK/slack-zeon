// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { buildBoard, getRandomWord, onGuess } from "../modules/hangman";
export default class HowWasUrDayMessage implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `If message matches 'today' il react & add it to db`;
    this.is_event = true;
  }
  run(app: App) {
    console.debug(`#message-hwowasurday`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel !== "C085KP183QQ") return;
      const message = par;
      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;
      if (par.event.hidden) return;
      // console.log(
      //   `uh one of them are here ffs`,
      //   par.event,
      //   par.event.channel_type,
      // );
      //@ts-ignore
      //   await par.ack();
      if (!onlyForMe(par.event.user)) return;
      //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      console.debug(`cmd`);
      const { event, say } = par;
      if (!(await app.db.get("hangman"))) {
        // lets create a hangman game!
        await app.db.set("hangman", {
          word: getRandomWord(),
          guesses: [],
          guessed: false,
          stage: 0,
        });
        await app.client.chat.postMessage({
          channel: event.channel,
          text: `:hangman: hangman starting...........\n all messages below are guesses fyi!\n${buildBoard(0)}`,
        });
      } else {
        const gameData = await app.db.get("hangman");
        const guess = event.text.trim().toLowerCase();
        const response = onGuess(
          guess,
          gameData.word,
          gameData.guesses,
          gameData.stage,
        );
        await app.db.set("hangman", {
          ...gameData,
          guesses: response.guessedLetters,
          stage: response.stage,
        });
        await app.client.chat.postMessage({
          channel: event.channel,
          text: `:hangman: ${response.message}`,
        });
      }

      // app.client.chat.postMessage({
      //   channel: event.channel,
      //   text: `:hangman: hangman is def starting and this isnt a placeholder message :p`,
      // });
      console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
