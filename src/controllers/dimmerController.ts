import { DialAction, KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { BaseController } from "./baseController";
import { DimmerSettings } from "@actions/dimmerAction";

/**
 * A DimmerController action, for use with ActionManager. Tracks the
 * state and Stream Deck action for an individual action in a profile.
 */
export class DimmerController extends BaseController {
  type = "DimmerController";

  private _settings: DimmerSettings | null = null;

  /**
   * Creates a new DimmerController.
   * @param action The Stream Deck action object
   */
  constructor(action: KeyAction | DialAction, settings: DimmerSettings) {
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
  set settings(newValue: DimmerSettings) {
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
    if (this.action.isDial()) {
      this.action.setFeedback({
        indicator: this.settings.state,
        value: `${this.settings.state}%`
      });
    }
  }

  isSwitchedOn() {
    return parseInt(this.settings.state) > 0;
  }
}

/**
 * Typeguard for DimmerController.
 * @param action The action
 * @returns True if the action is a DimmerController
 */
export function isDimmerController(
  action: Controller
): action is DimmerController {
  return action.type === "DimmerController";
}
