import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { RollerShutterAction, RollerShutterSettings } from "./rollerShutterAction";
import actionManager from "@managers/actionManager";
import type { KeyAction, KeyDownEvent, KeyUpEvent, DialDownEvent, DialUpEvent } from "@elgato/streamdeck";

function createSettings(): RollerShutterSettings {
	return { title: "Blinds", itemName: "Blinds_1", state: "50", latestCommand: "" };
}

function createFakeAction(id: string): KeyAction<RollerShutterSettings> {
	return { id } as unknown as KeyAction<RollerShutterSettings>;
}

function createKeyDownEvent(action: KeyAction<RollerShutterSettings>): KeyDownEvent<RollerShutterSettings> {
	return { action } as unknown as KeyDownEvent<RollerShutterSettings>;
}

function createKeyUpEvent(action: KeyAction<RollerShutterSettings>, settings: RollerShutterSettings): KeyUpEvent<RollerShutterSettings> {
	return { action, payload: { settings } } as unknown as KeyUpEvent<RollerShutterSettings>;
}

function createDialDownEvent(action: KeyAction<RollerShutterSettings>): DialDownEvent<RollerShutterSettings> {
	return { action } as unknown as DialDownEvent<RollerShutterSettings>;
}

function createDialUpEvent(action: KeyAction<RollerShutterSettings>, settings: RollerShutterSettings): DialUpEvent<RollerShutterSettings> {
	return { action, payload: { settings } } as unknown as DialUpEvent<RollerShutterSettings>;
}

describe("RollerShutterAction press handling", () => {
	let sendCommandSpy: MockInstance<typeof actionManager.sendCommand>;
	let sendDirectionSpy: MockInstance<typeof actionManager.sendShutterDirectionCommand>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
		sendDirectionSpy = vi.spyOn(actionManager, "sendShutterDirectionCommand").mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
		sendCommandSpy.mockRestore();
		sendDirectionSpy.mockRestore();
	});

	it("sends STOP on a short button press", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onKeyDown(createKeyDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(action, settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "STOP");
		expect(sendDirectionSpy).not.toHaveBeenCalled();
	});

	it("sends the direction command on a long button press", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onKeyDown(createKeyDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(action, settings));

		expect(sendDirectionSpy).toHaveBeenCalledWith(action);
		expect(sendCommandSpy).not.toHaveBeenCalled();
	});

	it("sends STOP on a short dial push", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onDialDown(createDialDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
		rollerShutter.onDialUp(createDialUpEvent(action, settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "STOP");
		expect(sendDirectionSpy).not.toHaveBeenCalled();
	});

	it("sends the direction command on a long dial push", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onDialDown(createDialDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onDialUp(createDialUpEvent(action, settings));

		expect(sendDirectionSpy).toHaveBeenCalledWith(action);
		expect(sendCommandSpy).not.toHaveBeenCalled();
	});

	it("tracks presses on two different instances independently", () => {
		const rollerShutter = new RollerShutterAction();
		const actionA = createFakeAction("action-a");
		const actionB = createFakeAction("action-b");
		const settingsA = createSettings();
		const settingsB = createSettings();

		rollerShutter.onKeyDown(createKeyDownEvent(actionA));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.100Z"));
		rollerShutter.onKeyDown(createKeyDownEvent(actionB));

		vi.setSystemTime(new Date("2026-01-01T00:00:00.300Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(actionA, settingsA));

		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(actionB, settingsB));

		expect(sendCommandSpy).toHaveBeenCalledWith(settingsA, "STOP");
		expect(sendDirectionSpy).toHaveBeenCalledWith(actionB);
	});
});
