import { action, KeyDownEvent, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent, DialDownEvent, DialRotateEvent, TouchTapEvent, KeyUpEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import streamDeck from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";
import { DebouncedDialAction } from "./debouncedDialAction";

let logger = streamDeck.logger.createScope("RollerShutterAction");

/**
 * Action class that controls the position of a roller shutter item.
 * 
 * On button press, the state of the item will be toggled
 * On dial turn, the position will be increased or decreased.
 */
@action({ UUID: "org.openhab.stream-deck-plugin.roller-shutter" })
export class RollerShutterAction extends DebouncedDialAction<RollerShutterSettings> {

	private pressStart: Date | null = null;

	override onWillAppear(ev: WillAppearEvent<RollerShutterSettings>): void | Promise<void> {
		actionManager.addRollerShutter(ev.action, ev.payload.settings);
		actionManager.refreshItemState(ev.payload.settings.itemName);
	}

	override onWillDisappear(ev: WillDisappearEvent<RollerShutterSettings>): Promise<void> | void {
		actionManager.remove(ev.action);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<RollerShutterSettings>): Promise<void> | void {
		actionManager.updateRollerShutter(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<RollerShutterSettings>): Promise<void> {
		// Toggle the dimmer state
		const { settings } = ev.payload;
		logger.debug(`KeyDown for Roller shutter item name: ${settings.itemName} and state ${settings.state}`);
		this.pressStart = new Date();
	}

	override onKeyUp(ev: KeyUpEvent<RollerShutterSettings>): Promise<void> | void {
		if (this.pressStart) {
			logger.debug(`Key press for ${new Date().getTime() - this.pressStart?.getTime()}ms`);
		}
		this.pressStart = null;
	}

	override onDialDown(ev: DialDownEvent<RollerShutterSettings>): Promise<void> | void {
		// Toggle the dimmer state
		const { settings } = ev.payload;
		logger.debug(`DialDown for Roller shutter item name: ${settings.itemName} and state ${settings.state}`);
	}

	override onTouchTap(ev: TouchTapEvent<RollerShutterSettings>): Promise<void> | void {
		logger.debug(`TouchTap for Roller shutter item name: ${ev.payload.settings.itemName}`);
	}

	override onDialRotate(ev: DialRotateEvent<RollerShutterSettings>): Promise<void> | void {
		this.handleDialRotate(ev);
	}

	protected override onIntermediateRotate(ev: DialRotateEvent<RollerShutterSettings>, accumulatedTicks: number): void {
		const feedbackValue = this.clamp(parseInt(ev.payload.settings.state) + accumulatedTicks);

		ev.action.setFeedback({
			indicator: feedbackValue,
			value: `${feedbackValue}%`
		})
	}

	protected override async onDebouncedRotate(ev: DialRotateEvent<RollerShutterSettings>, totalTicks: number) {
		const newState = this.clamp(
			parseInt(ev.payload.settings.state) + totalTicks
		).toString();

		logger.debug(
			`Sending new roller shutter position value (${newState}) for ${ev.payload.settings.itemName}`
		);

		actionManager.updateItemState(ev.payload.settings.itemName, newState);
		actionManager.sendCommand(ev.payload.settings, newState);
	}

}

/**
 * Settings for {@link RollerShutter}.
 */
export interface RollerShutterSettings extends BaseSettings {
	[key: string]: JsonValue;
};
