import { App } from "@slack/bolt";
import { Command } from "./BaseCommand";
import { readdirSync } from "fs";
import path from "path";

export default class CommandLoader {
  private _app: App;
  // private _commands: Map<string, Command>;
  public readonly dir: string;
  public constructor(app: App, dir: string) {
    this._app = app;
    // this._commands = new Map();
    this.dir = dir;
  }
  // private commandsInArray(): Command[] {
  //   return Array.from(this._commands.values());
  // }
  // public getSlackCommandData(): {
  //   name: string;
  //   description: string;
  //   usage?: string;
  // }[] {
  //   return this.commandsInArray().map((e) => {
  //     return {
  //       name: e.name,
  //       description: e.description,
  //       usage: e.usage,
  //     };
  //   });
  // }
  private getFiles(): string[] {
    return readdirSync(this.dir);
  }
  public async runQuery() {
    const files = this.getFiles();
    const cmds = [];
    let logging_values = [];
    for (const file of files) {
      const stamp = Date.now();
      try {
        const commandClass = require(path.join(this.dir, file));
        cmds.push({ commandClass, file });
        // const cmd = new commandClass.default();
        // cmd.run(this._app);
        console.log(`Loaded ${file}`);
        logging_values.push({ file, loaded: true });
      } catch (e) {
        console.error(e);
        console.error(`Failed to load ${file}`);
        logging_values.push({ file, failed: true });
      } finally {
        console.log(`Finished  reading/dying to ${file}`);
        logging_values.find((e) => e.file === file).took_read = `${Date.now() - stamp}ms`;
      }
    }
    for (const { commandClass, file } of cmds) {
      const stamp = Date.now();
      const c = new commandClass.default();
      console.log(`Running ${file}`);
      try {
        c.run(this._app);
        console.log(`Ran ${file}`);
        logging_values.find((e) => e.file === file).ran = true;
      } catch (e) {
        console.error(e);
        console.error(`Failed to run ${file}`);
        logging_values.find((e) => e.file === file).failed_run = true;
      } finally {
        console.log(`Finished ${file}`);
        logging_values.find((e) => e.file === file).took =
          `${Date.now() - stamp}ms`;
      }
    }
    console.table(logging_values);
  }
}
