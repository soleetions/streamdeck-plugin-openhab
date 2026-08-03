import { action, KeyDownEvent, KeyUpEvent, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent, DialDownEvent, DialUpEvent, DialRotateEvent, TouchTapEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";
import { DebouncedDialAction, PressAction } from "./debouncedDialAction";

const logger = streamDeck.logger.createScope("RollerShutterAction");

/**
 * Action class that controls a roller shutter item.
 *
 * Dial rotation sets an exact position (percentage). Button push and dial
 * push send STOP on a short press (<500ms), or the next UP/DOWN direction
 * on a long press (>=500ms), alternating each time.
 */
@action({ UUID: "org.openhab.stream-deck-plugin.roller-shutter" })
export class RollerShutterAction extends DebouncedDialAction<RollerShutterSettings> {

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

	override onKeyDown(ev: KeyDownEvent<RollerShutterSettings>): void {
		this.handlePressDown(ev.action);
	}

	override onKeyUp(ev: KeyUpEvent<RollerShutterSettings>): void {
		this.handlePressUp(ev.action, ev.payload.settings);
	}

	override onDialDown(ev: DialDownEvent<RollerShutterSettings>): void {
		this.handlePressDown(ev.action);
	}

	override onDialUp(ev: DialUpEvent<RollerShutterSettings>): void {
		this.handlePressUp(ev.action, ev.payload.settings);
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
			value: `${feedbackValue.toString()}%`
		}).catch((error: unknown) => {
			logger.error(error);
		});
	}

	protected override onDebouncedRotate(ev: DialRotateEvent<RollerShutterSettings>, totalTicks: number): void {
		const newState = this.clamp(
			parseInt(ev.payload.settings.state) + totalTicks
		).toString();

		logger.debug(
			`Sending new roller shutter position value (${newState}) for ${ev.payload.settings.itemName}`
		);

		actionManager.updateItemState(ev.payload.settings.itemName, newState);
		actionManager.sendCommand(ev.payload.settings, newState);
	}

	protected override onShortPress(action: PressAction<RollerShutterSettings>, settings: RollerShutterSettings): void {
		logger.debug(`Short press for Roller shutter item name: ${settings.itemName}, sending STOP`);
		actionManager.sendCommand(settings, "STOP");
	}

	protected override onLongPress(action: PressAction<RollerShutterSettings>, settings: RollerShutterSettings): void {
		logger.debug(`Long press for Roller shutter item name: ${settings.itemName}, sending direction command`);
		actionManager.sendShutterDirectionCommand(action);
	}

}

/**
 * Settings for {@link RollerShutter}.
 */
export type RollerShutterSettings = BaseSettings;
