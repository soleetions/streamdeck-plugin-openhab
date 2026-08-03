import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { RollerShutterAction, RollerShutterSettings } from "./rollerShutterAction";
import actionManager from "@managers/actionManager";
import type { KeyAction, KeyDownEvent, KeyUpEvent, DialDownEvent, DialUpEvent } from "@elgato/streamdeck";

interface FakeAction {
	id: string;
	setSettings: ReturnType<typeof vi.fn>;
}

function createSettings(latestCommand = ""): RollerShutterSettings {
	return { title: "Blinds", itemName: "Blinds_1", state: "50", latestCommand };
}

function createFakeAction(id: string): FakeAction {
	return {
		id,
		setSettings: vi.fn(() => Promise.resolve())
	};
}

function asKeyAction(action: FakeAction): KeyAction<RollerShutterSettings> {
	return action as unknown as KeyAction<RollerShutterSettings>;
}

function createKeyDownEvent(action: FakeAction): KeyDownEvent<RollerShutterSettings> {
	return { action: asKeyAction(action) } as unknown as KeyDownEvent<RollerShutterSettings>;
}

function createKeyUpEvent(action: FakeAction, settings: RollerShutterSettings): KeyUpEvent<RollerShutterSettings> {
	return { action: asKeyAction(action), payload: { settings } } as unknown as KeyUpEvent<RollerShutterSettings>;
}

function createDialDownEvent(action: FakeAction): DialDownEvent<RollerShutterSettings> {
	return { action: asKeyAction(action) } as unknown as DialDownEvent<RollerShutterSettings>;
}

function createDialUpEvent(action: FakeAction, settings: RollerShutterSettings): DialUpEvent<RollerShutterSettings> {
	return { action: asKeyAction(action), payload: { settings } } as unknown as DialUpEvent<RollerShutterSettings>;
}

describe("RollerShutterAction press handling", () => {
	let sendCommandSpy: MockInstance<typeof actionManager.sendCommand>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
		sendCommandSpy.mockRestore();
	});

	it("sends STOP on a short button press, without touching settings", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onKeyDown(createKeyDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(action, settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "STOP");
		expect(action.setSettings).not.toHaveBeenCalled();
	});

	it("sends and persists UP on a long button press, when nothing was sent before", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onKeyDown(createKeyDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(action, settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ latestCommand: "UP" }), "UP");
		expect(action.setSettings).toHaveBeenCalledWith(expect.objectContaining({ latestCommand: "UP" }));
	});

	it("sends and persists the opposite direction on a long button press, when UP was sent last", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings("UP");

		rollerShutter.onKeyDown(createKeyDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(action, settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ latestCommand: "DOWN" }), "DOWN");
	});

	it("sends STOP on a short dial push, without touching settings", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onDialDown(createDialDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
		rollerShutter.onDialUp(createDialUpEvent(action, settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "STOP");
		expect(action.setSettings).not.toHaveBeenCalled();
	});

	it("sends and persists the direction on a long dial push", () => {
		const rollerShutter = new RollerShutterAction();
		const action = createFakeAction("action-1");
		const settings = createSettings();

		rollerShutter.onDialDown(createDialDownEvent(action));
		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onDialUp(createDialUpEvent(action, settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ latestCommand: "UP" }), "UP");
		expect(action.setSettings).toHaveBeenCalledWith(expect.objectContaining({ latestCommand: "UP" }));
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
		expect(actionA.setSettings).not.toHaveBeenCalled();
		expect(sendCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ itemName: "Blinds_1", latestCommand: "UP" }), "UP");
		expect(actionB.setSettings).toHaveBeenCalledWith(expect.objectContaining({ latestCommand: "UP" }));
	});
});
