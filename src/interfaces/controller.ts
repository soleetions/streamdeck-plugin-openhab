import { DialAction, KeyAction } from "@elgato/streamdeck";

/**
 * Interface for all actions supported by this plugin
 */
export interface Controller {
  type: string;
  action: KeyAction | DialAction;
  itemName: string;
  refreshTitle(): void;
}
