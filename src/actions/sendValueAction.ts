import { action, KeyDownEvent, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import streamDeck from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";
import { OpenhabAction } from "./openhabAction";

let logger = streamDeck.logger.createScope("SendValueAction");

/**
 * Action class that sends a configured value for an item.
 * 
 * On button press, the specified value will be send to the server
 */
@action({ UUID: "org.openhab.stream-deck-plugin.send-value" })
export class SendValueAction extends OpenhabAction<SendValueSettings> {

	override onWillAppear(ev: WillAppearEvent<SendValueSettings>): void | Promise<void> {
		actionManager.addSendValue(ev.action, ev.payload.settings);
		actionManager.refreshItemState(ev.payload.settings.itemName);
	}

	override onWillDisappear(ev: WillDisappearEvent<SendValueSettings>): Promise<void> | void {
		actionManager.remove(ev.action);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<SendValueSettings>): Promise<void> | void {
		actionManager.updateSendValue(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<SendValueSettings>): Promise<void> {
		// Update the count from the settings.
		const { settings } = ev.payload;
		logger.info(`Item name: ${settings.itemName} and value ${settings.valueToSend}`);

		settings.itemType = settings.valueType;
		actionManager.sendCommand(settings, settings.valueToSend);
	}

}

/**
 * Settings for {@link SendValue}.
 */
export interface SendValueSettings extends BaseSettings {
	valueToSend: string;
	valueType: string;

	[key: string]: JsonValue;
};
