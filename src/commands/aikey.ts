import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";

export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `aichannelthing!`;
    this.description = `idek`;
  }
  run(app: ModifiedApp) {
    app.action(`i_want_key`, async ({ ack, event }) => {
      ack();
      // create random key
      const key = Math.random().toString() + event.user;
      //@ts-ignore
      const _keys = app.db.get(`ai_keys`) || [];
      _keys.push(key);
      app.db.set(`ai_keys`, _keys);
      await app.client.chat.postMessage({
        //@ts-ignore
        channel: event.user,
        text: `Here is your key!\n \`${key}\``,
      });
    });
  }
}
