import { DialAction, KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { BaseController } from "./baseController";
import { SwitchSettings } from "@actions/switchAction";

/**
 * A SwitchController action, for use with ActionManager. Tracks the
 * state and Stream Deck action for an individual action in a profile.
 */
export class SwitchController extends BaseController {
  type = "SwitchController";

  private _settings: SwitchSettings | null = null;

  /**
   * Creates a new SwitchController.
   * @param action The Stream Deck action object
   */
  constructor(action: KeyAction | DialAction, settings: SwitchSettings) {
    super(action, settings.itemName);
    this.settings = settings;
  }

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
  set settings(newValue: SwitchSettings) {
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
    // this.setTitle(this.settings.valueToSend);

    if (this.action.isKey()) {
      this.action.setState(+this.isSwitchedOn());
    }
  }

  isSwitchedOn() {
    return this.settings.state === "ON";
  }
}

/**
 * Typeguard for SwitchController.
 * @param action The action
 * @returns True if the action is a SwitchController
 */
export function isSwitchController(
  action: Controller
): action is SwitchController {
  return action.type === "SwitchController";
}
