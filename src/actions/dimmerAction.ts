import { action, KeyDownEvent, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent, DialDownEvent, DialRotateEvent, TouchTapEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import streamDeck from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";
import { DebouncedDialAction } from "./debouncedDialAction";

let logger = streamDeck.logger.createScope("DimmerAction");

/**
 * Action class that controls the brightness of a dimmer item.
 * 
 * On button press, the state of the item will be toggled
 * On dial turn, the brightness will be increased or decreased.
 */
@action({ UUID: "org.openhab.stream-deck-plugin.dimmer" })
export class DimmerAction extends DebouncedDialAction<DimmerSettings> {

	override onWillAppear(ev: WillAppearEvent<DimmerSettings>): void | Promise<void> {
		actionManager.addDimmer(ev.action, ev.payload.settings);
		actionManager.refreshItemState(ev.payload.settings.itemName);
	}

	override onWillDisappear(ev: WillDisappearEvent<DimmerSettings>): Promise<void> | void {
		actionManager.remove(ev.action);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<DimmerSettings>): Promise<void> | void {
		logger.debug(`New settings received: ${JSON.stringify(ev.payload.settings)}`);
		actionManager.updateDimmer(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<DimmerSettings>): Promise<void> {
		// Toggle the dimmer state
		const { settings } = ev.payload;
		logger.debug(`KeyDown for Dimmer item name: ${settings.itemName} and state ${settings.state}`);

		this.toggleState(settings);
	}

	override onDialDown(ev: DialDownEvent<DimmerSettings>): Promise<void> | void {
		// Toggle the dimmer state
		const { settings } = ev.payload;
		logger.debug(`DialDown for Dimmer item name: ${settings.itemName} and state ${settings.state}`);
		this.toggleState(settings);
	}

	override onTouchTap(ev: TouchTapEvent<DimmerSettings>): Promise<void> | void {
		logger.debug(`TouchTap for Dimmer item name: ${ev.payload.settings.itemName}`);
		this.toggleState(ev.payload.settings);
	}

	override onDialRotate(ev: DialRotateEvent<DimmerSettings>): Promise<void> | void {
		// logger.debug(`DialRotated for Dimmer item name: ${ev.payload.settings.itemName} with rotation: ${ev.payload.ticks}`);
		this.handleDialRotate(ev);
	}

	protected override onIntermediateRotate(ev: DialRotateEvent<DimmerSettings>, accumulatedTicks: number): void {
		const feedbackValue = this.clamp(parseInt(ev.payload.settings.state) + accumulatedTicks);

		ev.action.setFeedback({
			indicator: feedbackValue,
			value: `${feedbackValue}%`
		})
	}

	protected override async onDebouncedRotate(ev: DialRotateEvent<DimmerSettings>, totalTicks: number) {
		const newValue = this.clamp(
			parseInt(ev.payload.settings.state) + totalTicks
		).toString();

		logger.debug(
			`Sending new dimmer value (${newValue}) for ${ev.payload.settings.itemName}`
		);

		ev.payload.settings.state = newValue;
		actionManager.sendCommand(ev.payload.settings, newValue);
	}

	private toggleState(settings: DimmerSettings): void {
		actionManager.sendCommand(settings, parseInt(settings.state) > 0 ? "OFF" : "ON");
	}
}

/**
 * Settings for {@link Dimmer}.
 */
export interface DimmerSettings extends BaseSettings {
	itemType: "Percentage";
	[key: string]: JsonValue;
};
