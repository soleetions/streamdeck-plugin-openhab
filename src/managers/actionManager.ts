import { DisplayStateSettings } from "@actions/displayStateAction";

import openhabConnectionManager from "@managers/openhabConnectionManager";

import { DisplayStateController, isDisplayStateController } from "@controllers/displayStateController";

import streamDeck, { Action, ActionContext, DialAction, KeyAction } from "@elgato/streamdeck";
import { EventEmitter } from "events";
import { Controller } from "@interfaces/controller";
import { ItemStateChangedEvent, Payload } from "@interfaces/websocketMessages";
import { SendValueSettings } from "@actions/sendValueAction";
import { isSendValueController, SendValueController } from "@controllers/sendValueController";
import { ItemSettings } from "@interfaces/itemSettings";
import { SwitchSettings } from "@actions/switchAction";
import { isSwitchController, SwitchController } from "@controllers/switchController";
import { DimmerSettings } from "@actions/dimmerAction";
import { DimmerController, isDimmerController } from "@controllers/dimmerController";
import { isRollerShutterController, RollerShutterController } from "@controllers/rollerShutterController";
import { RollerShutterSettings } from "@actions/rollerShutterAction";
import { extractItemName } from "@managers/topicParser";
import { nextShutterDirection } from "@managers/shutterDirection";

const logger = streamDeck.logger.createScope("ActionManager");

/**
 * Singleton class that manages Stream Deck actions
 */
class ActionManager extends EventEmitter {

  /**
   * Singleton class that manages Stream Deck actions
   */

  private static instance: ActionManager | null = null;
  private actions: Controller[] = [];

  private constructor() {
    super();

  }

  /**
   * Provides access to the ActionManager instance.
   * @returns The instance of ActionManager
   */
  public static getInstance(): ActionManager {
    ActionManager.instance ??= new ActionManager();
    return ActionManager.instance;
  }

  /**
   * Adds a Display state action to the action list. Emits a displayStateAdded event
   * after the action is added.
   * @param action The action to add
   */
  public addDisplayState(action: KeyAction | DialAction, settings: DisplayStateSettings) {
    const controller = new DisplayStateController(action, settings);
    logger.info(`Add display state action for Item: ${settings.itemName}`);

    this.actions.push(controller);
    this.emit("displayStateAdded", controller);
    this.emit("actionAdded", controller);

    logger.debug(`Amount of actions known: ${this.actions.length.toString()}`);
  }

  /**
   * Adds a send value action to the action list. Emits a sendValueAdded event
   * after the action is added.
   * @param action The action to add
   */
  public addSendValue(action: KeyAction | DialAction, settings: SendValueSettings) {
    const controller = new SendValueController(action, settings);
    logger.info(`Add send value action for Item: ${settings.itemName}, with value ${settings.valueToSend}`);

    this.actions.push(controller);
    this.emit("sendValueAdded", controller);
    this.emit("actionAdded", controller);

    logger.debug(`Amount of actions known: ${this.actions.length.toString()}`);
  }

  /**
   * Adds a switch action to the action list. Emits a switchAdded event
   * after the action is added.
   * @param action The action to add
   */
  public addSwitch(action: KeyAction | DialAction, settings: SwitchSettings) {
    const controller = new SwitchController(action, settings);
    logger.info(`Add switch action for Item: ${settings.itemName}`);

    this.actions.push(controller);
    this.emit("switchAdded", controller);
    this.emit("actionAdded", controller);

    logger.debug(`Amount of actions known: ${this.actions.length.toString()}`);
  }

  /**
   * Adds a dimmer action to the action list. Emits a dimmerAdded event
   * after the action is added.
   * @param action The action to add
   */
  public addDimmer(action: KeyAction | DialAction, settings: DimmerSettings) {
    const controller = new DimmerController(action, settings);
    logger.info(`Add dimmer action for Item: ${settings.itemName}`);

    this.actions.push(controller);
    this.emit("dimmerAdded", controller);
    this.emit("actionAdded", controller);

    logger.debug(`Amount of actions known: ${this.actions.length.toString()}`);
  }

  /**
   * Adds a roller shutter action to the action list. Emits a rollerShutterAdded event
   * after the action is added.
   * @param action The action to add
   */
  public addRollerShutter(action: KeyAction | DialAction, settings: RollerShutterSettings) {
    const controller = new RollerShutterController(action, settings);
    logger.info(`Add roller shutter action for Item: ${settings.itemName}`);

    this.actions.push(controller);
    this.emit("rollerShutterAdded", controller);
    this.emit("actionAdded", controller);

    logger.debug(`Amount of actions known: ${this.actions.length.toString()}`);
  }

  /**
   * Updates the settings associated with a display state action.
   * Emits a displayStateSettingsUpdated event if the settings require
   * the action to refresh.
   * @param action The action to update
   * @param settings The new settings to use
   */
  public updateDisplayState(action: Action, settings: DisplayStateSettings) {
    const foundController = this.getDisplayStateControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!foundController) {
      return;
    }

    foundController.itemName = settings.itemName;
    foundController.settings = settings;
  }

  /**
   * Updates the settings associated with a send value action.
   * the action to refresh.
   * @param action The action to update
   * @param settings The new settings to use
   */
  public updateSendValue(action: Action, settings: SendValueSettings) {
    const foundController = this.getSendValueControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!foundController) {
      return;
    }

    foundController.itemName = settings.itemName;
    foundController.settings = settings;
  }

  /**
   * Updates the settings associated with a switch action.
   * the action to refresh.
   * @param action The action to update
   * @param settings The new settings to use
   */
  public updateSwitch(action: Action, settings: SwitchSettings) {
    const foundController = this.getSwitchControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!foundController) {
      return;
    }
    const itemNameChanged = foundController.settings.itemName !== settings.itemName;

    foundController.itemName = settings.itemName;
    foundController.settings = settings;

    if (itemNameChanged) {
      this.refreshItemState(settings.itemName);
    }
  }

  /**
   * Updates the settings associated with a dimmer action.
   * the action to refresh.
   * @param action The action to update
   * @param settings The new settings to use
   */
  public updateDimmer(action: Action, settings: DimmerSettings) {
    const foundController = this.getDimmerControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!foundController) {
      return;
    }
    const itemNameChanged = foundController.settings.itemName !== settings.itemName;

    foundController.itemName = settings.itemName;
    foundController.settings = settings;

    if (itemNameChanged) {
      this.refreshItemState(settings.itemName);
    }
  }


  /**
   * Updates the settings associated with a roller shutter action.
   * the action to refresh.
   * @param action The action to update
   * @param settings The new settings to use
   */
  public updateRollerShutter(action: Action, settings: RollerShutterSettings) {
    const foundController = this.getRollerShutterControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!foundController) {
      return;
    }
    const itemNameChanged = foundController.settings.itemName !== settings.itemName;

    foundController.itemName = settings.itemName;
    foundController.settings = settings;

    if (itemNameChanged) {
      this.refreshItemState(settings.itemName);
    }
  }

  /**
   * Removes an action from the list.
   * @param action The action to remove
   */
  public remove(action: ActionContext): void {
    logger.debug(`Remove action ${action.id}`)
    this.actions = this.actions.filter(
      (entry) => entry.action.id !== action.id
    );

    this.emit("removed", this.actions.length);
    logger.debug(`Amount of actions known: ${this.actions.length.toString()}`);
  }

  public handleItemState(data: ItemStateChangedEvent) {
    const itemName = extractItemName(data.topic)
    const payload = JSON.parse(data.payload) as Payload;

    this.updateItemState(itemName, payload.value);
  }

  public updateItemState(itemName: string, state: string) {
    const controllers: Controller[] = this.findActionByItemName(itemName);
    controllers.forEach(controller => {
      controller.action.getSettings().then(async settings => {
        logger.debug(`Updating item state for item ${JSON.stringify(settings.itemName)} to value ${state}`);
        settings.state = state;

        await controller.action.setSettings(settings);

        controller.setState(state);
      }).catch((error: unknown) => {
        logger.error(error);
      })
    })
  }

  private findActionByItemName(itemName: string): Controller[] {
    return this.actions.filter((entry) => entry.itemName == itemName);
  }

  /**
   * Returns an array of all the actions tracked by the action manager.
   * @returns An array of the currently tracked actions
   */
  public getActions(): Controller[] {
    return this.actions;
  }

  /**
   * Returns a list of controllers that match the type guard.
   * @param typeGuard Function that returns true if the Controller is the correct type
   * @returns A list of controllers matching the type guard
   */
  public getControllers<T extends Controller>(
    typeGuard: (action: Controller) => action is T
  ): T[] {
    return this.actions.filter(typeGuard);
  }

  /**
   * Retrieves the list of all tracked DisplayStateControllers.
   * @returns An array of DisplayStateControllers
   */
  public getDisplayStateControllers(): DisplayStateController[] {
    return this.getControllers(isDisplayStateController);
  }

  /**
   * Retrieves the list of all tracked SendValueController.
   * @returns An array of SendValueControllers
   */
  public getSendValueControllers(): SendValueController[] {
    return this.getControllers(isSendValueController);
  }

  /**
   * Retrieves the list of all tracked SwitchController.
   * @returns An array of SwitchControllers
   */
  public getSwitchControllers(): SwitchController[] {
    return this.getControllers(isSwitchController);
  }

  /**
   * Retrieves the list of all tracked DimmerController.
   * @returns An array of DimmerControllers
   */
  public getDimmerControllers(): DimmerController[] {
    return this.getControllers(isDimmerController);
  }

  /**
   * Retrieves the list of all tracked RollerShutterControllers.
   * @returns An array of RollerShutterControllers
   */
  public getRollerShutterControllers(): RollerShutterController[] {
    return this.getControllers(isRollerShutterController);
  }

  /**
   * Temporarily shows an alert warning on all tracked actions.
   */
  public showAlertOnAll() {
    this.actions.forEach((entry) => {
      entry.action.showAlert().catch((error: unknown) => {
        logger.error(error);
      });
    });
  }

  /**
   * Refreshes the title on all tracked actions.
   */
  public refreshAllTitles() {
    this.actions.forEach((entry) => {
      entry.refreshTitle();
    });
  }

  /**
   * Requests the current state of an item
   * @param itemName Item name
   */
  public refreshItemState(itemName: string) {
    if (itemName) {
      logger.debug(`Refreshing state of item ${itemName}`);
      openhabConnectionManager.getItemState(itemName);
    }
  }

  /**
   * Requests the current state of all items
   */
  public async getItems(): Promise<string[]> {
    return await openhabConnectionManager.getItems();
  }

  /**
   * Send a command to update an item state
   * @param itemName Item name
   * @param command Value to send
   */
  public sendCommand(settings: ItemSettings, command: string | number) {
    logger.debug(`Sending command ${command.toString()} to item ${settings.itemName}, with type ${JSON.stringify(settings.itemType)}`);
    openhabConnectionManager.sendCommand(settings.itemName, command);
  }

  /**
   * Sends the next UP/DOWN direction command for a roller shutter item, and
   * persists the direction to send on the following long press.
   * @param itemName Item name
   */
  public sendShutterDirectionCommand(itemName: string): void {
    const controllers = this.getRollerShutterControllers().filter(
      (controller) => controller.itemName === itemName
    );

    controllers.forEach(controller => {
      controller.action.getSettings<RollerShutterSettings>().then(async settings => {
        const { toSend, toPersist } = nextShutterDirection(settings.latestCommand);

        settings.latestCommand = toPersist;
        await controller.action.setSettings(settings);

        this.sendCommand(settings, toSend);
      }).catch((error: unknown) => {
        logger.error(error);
      });
    });
  }

}

const actionManagerInstance = ActionManager.getInstance();
export default actionManagerInstance;
