// i have no ideas for this rn but jusst in case :3
import { ModifiedApp } from "./slackapp";
export class TempHackclubEmail {
  email: string;
  name: string;
  private messageId: string | null;
  app: ModifiedApp;
  constructor(
    private user: string,
    app: ModifiedApp,
  ) {
    this.name = user;
    this.app = app;
    this.messageId = null;
  }
  async createEmail() {
    const m = await this.app.client.chat.postMessage({
      channel: `C02GK2TVAVB`,
      text: `gib email`,
    });
    this.messageId = m.ts!;
    await this.app.client.chat.postMessage({
      channel: `C02GK2TVAVB`,
      text: `<@${this.user}> -  email`,
      thread_ts: this.messageId,
    });
  }
  destroy() {
    // deleting the message _should_ delete the email
    this.app.client.chat.delete({
      channel: `C02GK2TVAVB`,
      ts: this.messageId!,
    });
    this.messageId = null;
  }
}
