import { App } from "@slack/bolt";
import { Command } from "./BaseCommand";
import { readdirSync } from "fs";
import path from "path";

export default class CommandLoader {
  private _app: App;
  public readonly dir: string;

  public constructor(app: App, dir: string) {
    this._app = app;
    this.dir = dir;
  }

  private getFiles(): string[] {
    return readdirSync(this.dir).filter(
      (file) => file.endsWith(".js") || file.endsWith(".ts"),
    );
  }

  public async runQuery() {
    const files = this.getFiles();
    const cmds: { commandClass: any; file: string }[] = [];
    const logging_values: any[] = [];

    for (const file of files) {
      const stamp = Date.now();
      try {
        const fullPath = path.resolve(this.dir, file);
        const commandClass = await import(fullPath);
        cmds.push({ commandClass, file });
        console.log(`Loaded ${file}`);
        logging_values.push({ file, loaded: true });
      } catch (e) {
        console.error(`Failed to load ${file}:`, e);
        logging_values.push({ file, failed: true });
      } finally {
        const log = logging_values.find((e) => e.file === file);
        if (log) log.took_read = `${Date.now() - stamp}ms`;
      }
    }

    for (const { commandClass, file } of cmds) {
      const stamp = Date.now();
      console.log(`Running ${file}`);
      try {
        const instance: Command = commandClass.default
          ? new commandClass.default()
          : new commandClass();
        instance.run(this._app);
        console.log(`Ran ${file}`);
        const log = logging_values.find((e) => e.file === file);
        if (log) log.ran = true;
      } catch (e) {
        console.error(`Failed to run ${file}:`, e);
        const log = logging_values.find((e) => e.file === file);
        if (log) log.failed_run = true;
      } finally {
        const log = logging_values.find((e) => e.file === file);
        if (log) log.took = `${Date.now() - stamp}ms`;
        console.log(`Finished ${file}`);
      }
    }

    console.table(logging_values);
  }
}
