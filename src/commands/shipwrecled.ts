
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class CTF implements Command {
    name: string;
    description: string;
    constructor() {
        this.name = `/scctf`;
        this.description = `Capture the flag?? but shipwrecked`;
    }
    run(app: App) {
        // app.command()
        app.command(this.name, async ({ command, ack, respond }) => {
            await ack();
            if (command.text == process.env.SHIPWRECKED_JOIN_SECRET) {
                // invite user to channel
                app.client.channels.invite({
                    channel: "C097UG2S11V",
                    user: command.user_id
                })
                // respond
                respond({
                    text: `_psst_ you got passed step one, now will u be able to make it passed step two!, here is ur hint: prizes, what should they be.`,
                    response_type: "ephemeral"
                })
            } else {
                // respond
                respond({
                    text: `_psst_ guess better kid..`,
                    response_type: "ephemeral"
                })
            }
        });
    }
}
