import { DisplayStateSettings } from "@actions/displayStateAction";
import { DialAction, KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { BaseController } from "./baseController";

/**
 * A DisplayStateController action, for use with ActionManager. Tracks the
 * state and Stream Deck action for an individual action in a profile.
 */
export class DisplayStateController extends BaseController {
  type = "DisplayStateController";

  private _settings: DisplayStateSettings | null = null;

  /**
   * Creates a new DisplayStateController.
   * @param action The Stream Deck action object
   */
  constructor(action: KeyAction | DialAction, settings: DisplayStateSettings) {
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
  set settings(newValue: DisplayStateSettings) {
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
    this.setTitle(this.settings.state);
  }
}

/**
 * Typeguard for DisplayStateController.
 * @param action The action
 * @returns True if the action is a DisplayStateController
 */
export function isDisplayStateController(
  action: Controller
): action is DisplayStateController {
  return action.type === "DisplayStateController";
}
