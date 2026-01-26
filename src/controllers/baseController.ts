import { DialAction, KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";

export const StateColor = {
  NOT_CONNECTED: "white",
  CONNECTED: "#5fcdfa"
};

/**
 * Base implementation for a Controller that includes methods for
 * managing the title and image display on a Stream Deck action.
 */
export abstract class BaseController implements Controller {
  /**
   * Used to type guard the derived classes.
   */
  abstract type: string;

  /**
   * The Stream Deck action this controller manages.
   */
  action: KeyAction | DialAction;

  /**
   * The OpenHAB Item name this controller manages. 
   */
  itemName: string;

  /**
   * Initializes the BaseController.
   * @param action The Stream Deck icon this wraps
   */
  constructor(action: KeyAction | DialAction, itemName: string) {
    this.action = action;
    this.itemName = itemName;
  }

  /**
   * Refreshes the title displayed on the action.
   */
  abstract refreshTitle(): void;

  /**
   * Sets the title on the tracked action, catching any exceptions
   * that might occur.
   * @param title The title to set.
   */
  setTitle(title: string) {
    this.action.setTitle(title);
  }

}
