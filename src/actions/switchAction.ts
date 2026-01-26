import { action, KeyDownEvent, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent, DialDownEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import streamDeck from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";
import { OpenhabAction } from "./openhabAction";

let logger = streamDeck.logger.createScope("SwitchAction");


/**
 * Action class that toggles the ON/OFF state of an item.
 * 
 * On button press, the state of the item will be toggled
 */
@action({ UUID: "org.openhab.stream-deck-plugin.switch" })
export class SwitchAction extends OpenhabAction<SwitchSettings> {

	override onWillAppear(ev: WillAppearEvent<SwitchSettings>): void | Promise<void> {
		actionManager.addSwitch(ev.action, ev.payload.settings);
		actionManager.refreshItemState(ev.payload.settings.itemName);
	}

	override onWillDisappear(ev: WillDisappearEvent<SwitchSettings>): Promise<void> | void {
		actionManager.remove(ev.action);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<SwitchSettings>): Promise<void> | void {
		logger.debug(`Switch settings updated: ${JSON.stringify(ev)}`);
		logger.debug(`New settings received: ${JSON.stringify(ev.payload.settings)}`);
		actionManager.updateSwitch(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<SwitchSettings>): Promise<void> {
		// Toggle the switch state
		const { settings } = ev.payload;
		logger.debug(`KeyDown for Switch item name: ${settings.itemName} and state ${settings.state}`);

		this.toggleState(settings);
	}

	override onDialDown(ev: DialDownEvent<SwitchSettings>): Promise<void> | void {
		// Toggle the switch state
		const { settings } = ev.payload;
		logger.debug(`DialDown for Switch item name: ${settings.itemName} and state ${settings.state}`);
		this.toggleState(settings);
	}

	private toggleState(settings: SwitchSettings): void {
		actionManager.sendCommand(settings, settings.state === "ON" ? "OFF" : "ON");
	}

}

/**
 * Settings for {@link Switch}.
 */
export interface SwitchSettings extends BaseSettings {
	itemType: "OnOff";
	[key: string]: JsonValue;
};
