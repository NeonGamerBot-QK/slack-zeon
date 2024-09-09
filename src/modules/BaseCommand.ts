import { App } from "@slack/bolt";

export interface Command {
  run(app: App): void;
  onload?: () => void;
  name: string;
  description: string;
  is_event?: boolean;
  usage?: string;
  custom_properties?: {
    [k: string]: any;
  };
}
export function onlyForMe(user: string): boolean {
  if (user === process.env.MY_USER_ID) {
    return true;
  } else {
    return false;
  }
}
