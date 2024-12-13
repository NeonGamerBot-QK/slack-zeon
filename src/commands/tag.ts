//Global tags for everyone
import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";

export default class TagSystem implements Command {
    name: string;
    description: string;
    constructor() {
        this.name = `/tag`;
        this.description = `Tag system`;
    }
    run(app: App) {
        // app.command()
        app.command(this.name, async ({ command, ack, respond }) => {
            const stamp = Date.now();
            await ack();

            // respond(`Pong took: \`${Date.now() - stamp}ms\``).then((d) => {
            //   console.debug(`after ping`, d);
            // });
            const args = command.text.split(" ");
            const cmd = args.shift();
            if (!cmd) return app.client.chat.postEmpheral({ channel: command.channel_id, user: command.user_id, text: `:x: Please provide a command` });
            // usage: /tag use <tag>
            // user based tag store
        });
        app.view("view_modal_tag", async ({ ack, body, view, context }) => {
            // TODO: make it grab the input/new input
            // submit and save for the user's tag
        })
    }
}
