import streamDeck, { DialAction, KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { BaseController } from "./baseController";
import { SendValueSettings } from "@actions/sendValueAction";

let logger = streamDeck.logger.createScope("SendValueController");

/**
 * A SendValueController action, for use with ActionManager. Tracks the
 * state and Stream Deck action for an individual action in a profile.
 */
export class SendValueController extends BaseController {
  type = "SendValueController";

  private _settings: SendValueSettings | null = null;

  /**
   * Creates a new SendValueController.
   * @param action The Stream Deck action object
   */
  constructor(action: KeyAction | DialAction, settings: SendValueSettings) {
    super(action, settings.itemName);
    this.settings = settings;
  }

  //#region Getters and setters
  /**
   * Returns the showTitle setting, or false if undefined.
   */
  get showTitle() {
    return this.settings.showTitle ?? false;
  }

  /**
   * Convenience method to return the action's title from settings.
   */
  get title() {
    return this.settings.title;
  }

  /**
   * Sets the settings.
   */
  set settings(newValue: SendValueSettings) {
    this._settings = newValue;

    this.refreshTitle();
  }

  /**
   * Gets the settings.
   */
  get settings() {
    if (this._settings === null) {
      throw new Error("Settings not initialized. This should never happen.");
    }

    return this._settings;
  }

  /**
   * Sets the title on the action.
   */
  public refreshTitle() {

    logger.debug(`Settings: ${JSON.stringify(this.settings)}`);
    const newTitle = `Send`;
    // if (ev.action.title !== undefined) {
    // 	newTitle.concat(`\n${ev.action.title}`);
    // }		
    newTitle.concat(`\n${this.settings.valueToSend}`);
    if (this.settings.valueType === "Percent") {
      newTitle.concat("%");
    }
    this.setTitle(newTitle);

    if (this.action.isKey()) {
      this.action.setState(+this.valuesMatch());
    }

  }

  valuesMatch() {
    return this.settings.state == this.settings.valueToSend;
  }
}

/**
 * Typeguard for SendValueController.
 * @param action The action
 * @returns True if the action is a SendValueController
 */
export function isSendValueController(
  action: Controller
): action is SendValueController {
  return action.type === "SendValueController";
}
