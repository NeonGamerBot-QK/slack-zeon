import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
import bcrypt from "bcrypt";
export default class Ping implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `aichannelthing!`;
    this.description = `idek`;
  }
  run(app: ModifiedApp) {
    app.action(`i_want_key`, async ({ ack, action, body }) => {
      ack();
      console.log(body);
      // create random key
      //@ts-ignore
      const key = Math.random().toString() + body.user.id;
      //@ts-ignore
      const _keys = app.db.get(`ai_keys`) || [];
      _keys.push(bcrypt.hashSync(key, 10));
      app.db.set(`ai_keys`, _keys);
      await app.client.chat.postMessage({
        //@ts-ignore
        channel: body.user.id,
        text: `Here is your key!\n \`${key}\``,
      });
    });
  }
}
