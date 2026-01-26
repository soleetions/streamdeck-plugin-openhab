import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import streamDeck from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";
import { OpenhabAction } from "./openhabAction";

let logger = streamDeck.logger.createScope("DisplayStateAction");

/**
 * Action class that displays the state of an item.
 * State will be updated from the {@link OpenhabConnectionManager} by the websocket connection.
 * 
 * On load and button press, the current state will be requested from the server
 */
@action({ UUID: "org.openhab.stream-deck-plugin.display-state" })
export class DisplayStateAction extends OpenhabAction<DisplayStateSettings> {

	/**
	 * The {@link SingletonAction.onWillAppear} event is useful for setting the visual representation of an action when it becomes visible. This could be due to the Stream Deck first
	 * starting up, or the user navigating between pages / folders etc.. There is also an inverse of this event in the form of {@link streamDeck.client.onWillDisappear}. In this example,
	 * we're setting the title to the "count" that is incremented in {@link IncrementCounter.onKeyDown}.
	 */
	override onWillAppear(ev: WillAppearEvent<DisplayStateSettings>): void | Promise<void> {
		actionManager.addDisplayState(ev.action, ev.payload.settings);
		actionManager.refreshItemState(ev.payload.settings.itemName);
	}

	override onWillDisappear(ev: WillDisappearEvent<DisplayStateSettings>): Promise<void> | void {
		actionManager.remove(ev.action);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<DisplayStateSettings>): Promise<void> | void {
		// logger.debug(`New settings received: -> ${ev.payload.settings.itemName}`);
		actionManager.updateDisplayState(ev.action, ev.payload.settings);
	}

	/**
	 * Listens for the {@link SingletonAction.onKeyDown} event which is emitted by Stream Deck when an action is pressed. Stream Deck provides various events for tracking interaction
	 * with devices including key down/up, dial rotations, and device connectivity, etc. When triggered, {@link ev} object contains information about the event including any payloads
	 * and action information where applicable. In this example, our action will display a counter that increments by one each press. We track the current count on the action's persisted
	 * settings using `setSettings` and `getSettings`.
	 */
	override async onKeyDown(ev: KeyDownEvent<DisplayStateSettings>): Promise<void> {
		// Update the count from the settings.
		const { settings } = ev.payload;

		actionManager.refreshItemState(settings.itemName);
	}

}

/**
 * Settings for {@link DisplayState}.
 */
export interface DisplayStateSettings extends BaseSettings {

	[key: string]: JsonValue;
};


