import { action, KeyUpEvent, WillAppearEvent, WillDisappearEvent, DidReceiveSettingsEvent, DialUpEvent, DialRotateEvent, TouchTapEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";
import { DebouncedDialAction } from "./debouncedDialAction";

const logger = streamDeck.logger.createScope("RollerShutterAction");

/**
 * Action class that controls the position of a roller shutter item.
 * 
 * On button press, the state of the item will be toggled
 * On dial turn, the position will be increased or decreased.
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

	override onKeyDown(): void {
		this.handlePressDown();
	}

	override onKeyUp(ev: KeyUpEvent<RollerShutterSettings>): void {
		this.handlePressUp(ev.payload.settings);
	}

	override onDialDown(): void {
		this.handlePressDown();
	}

	override onDialUp(ev: DialUpEvent<RollerShutterSettings>): void {
		this.handlePressUp(ev.payload.settings);
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

	protected override onShortPress(settings: RollerShutterSettings): void {
		logger.debug(`Short press for Roller shutter item name: ${settings.itemName}, sending STOP`);
		actionManager.sendCommand(settings, "STOP");
	}

	protected override onLongPress(settings: RollerShutterSettings): void {
		logger.debug(`Long press for Roller shutter item name: ${settings.itemName}, sending direction command`);
		actionManager.sendShutterDirectionCommand(settings.itemName);
	}

}

/**
 * Settings for {@link RollerShutter}.
 */
export type RollerShutterSettings = BaseSettings;
