import streamDeck, { DialAction, KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { BaseController } from "./baseController";
import { RollerShutterSettings } from "@actions/rollerShutterAction";

const logger = streamDeck.logger.createScope("RollerShutterController");

/**
 * A DimmerController action, for use with ActionManager. Tracks the
 * state and Stream Deck action for an individual action in a profile.
 */
export class RollerShutterController extends BaseController {
  type = "RollerShutterController";

  private _settings: RollerShutterSettings | null = null;

  /**
   * Creates a new RollerShutterController.
   * @param action The Stream Deck action object
   */
  constructor(action: KeyAction | DialAction, settings: RollerShutterSettings) {
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
  set settings(newSettings: RollerShutterSettings) {
    this._settings = newSettings;

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
      this.action.setState(+this.isSwitchedOn()).catch((error: unknown) => {
        logger.error(error);
      });
    }
    if (this.action.isDial()) {
      this.action.setFeedback({
        indicator: this.settings.state,
        value: `${this.settings.state}%`
      }).catch((error: unknown) => {
        logger.error(error);
      });
    }
  }

  isSwitchedOn() {
    return parseInt(this.settings.state) > 0;
  }

  /**
   * Updates the cached state and refreshes the action's title/feedback.
   */
  setState(state: string) {
    this.settings.state = state;
    this.refreshTitle();
  }
}

/**
 * Typeguard for RollerShutterController.
 * @param action The action
 * @returns True if the action is a RollerShutterController
 */
export function isRollerShutterController(
  action: Controller
): action is RollerShutterController {
  return action.type === "RollerShutterController";
}
