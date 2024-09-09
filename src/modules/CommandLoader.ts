import { App } from "@slack/bolt";
import { Command } from "./BaseCommand";
import { readdirSync } from "fs";
import path from "path";

export default class CommandLoader {
  private _app: App;
  private _commands: Map<string, Command>;
  public readonly dir: string;
  public constructor(app: App, dir: string) {
    this._app = app;
    this._commands = new Map();
    this.dir = dir;
  }
  private commandsInArray(): Command[] {
    return Array.from(this._commands.values());
  }
  public getSlackCommandData(): {
    name: string;
    description: string;
    usage?: string;
  }[] {
    return this.commandsInArray().map((e) => {
      return {
        name: e.name,
        description: e.description,
        usage: e.usage,
      };
    });
  }
  private getFiles(): string[] {
    return readdirSync(this.dir);
  }
  public async runQuery() {
    const files = this.getFiles();
    for (const file of files) {
      try {
        const commandClass = await import(path.join(this.dir, file));
        const cmd = new commandClass.default();
        cmd.run(this._app);
      } catch (e) {
        console.error(`Failed to load ${file}`);
      }
    }
  }
}
