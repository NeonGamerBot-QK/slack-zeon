import { App } from "@slack/bolt";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { getShopItem, searchShop } from "../modules/Songs";

export default class Shop implements Command {
  name: string;
  description: string;
  constructor() {
    this.name = `/shop`;
    this.description = `Get high seas shop info`;
  }
  run(app: App) {
    // app.command()
    app.command(this.name, async ({ command, ack, respond }) => {
      await ack();
const args = command.text.split(" ")
const subcmd = args.shift().toLowerCase()
switch(subcmd) {
    case "search": 
        const query = args.join(" ")
        const results = await searchShop(query)
        // responsd
        if (results.length === 0) {
            respond(`No results found for \`${query}\``)
            return
            

        }
        respond(`Search results for \`${query}\`:\n${results.map(e => `> ${e.name}\`${e.id}\` - ${e.subtitle}`).join("\n")}`)
        break;
        case "item":
            const item = args.join(" ")
            const result = await getShopItem(item)
            if (!result) {
                respond(`No results found for \`${item}\``)
                return
            }
            respond(Object.entries(result).map(e=> `> ${e[0]}: ${e[1].toString()}`).join("\n"))
        default:
        respond(`Unknown subcmd \`${subcmd}\``)
        break;
}   
});
  }
}
