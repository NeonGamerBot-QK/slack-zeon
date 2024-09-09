import { App } from "@slack/bolt";

export interface Command {
  run(app: App): void;
  onload?: () => void;
  name: string;
  description: string;
  usage?: string;
  custom_properties?: {
    [k: string]: any;
  };
}
