import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { RollerShutterAction, RollerShutterSettings } from "./rollerShutterAction";
import actionManager from "@managers/actionManager";
import type { KeyUpEvent, DialUpEvent } from "@elgato/streamdeck";

function createSettings(): RollerShutterSettings {
	return { title: "Blinds", itemName: "Blinds_1", state: "50", latestCommand: "" };
}

function createKeyUpEvent(settings: RollerShutterSettings): KeyUpEvent<RollerShutterSettings> {
	return { payload: { settings } } as unknown as KeyUpEvent<RollerShutterSettings>;
}

function createDialUpEvent(settings: RollerShutterSettings): DialUpEvent<RollerShutterSettings> {
	return { payload: { settings } } as unknown as DialUpEvent<RollerShutterSettings>;
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
		const settings = createSettings();

		rollerShutter.onKeyDown();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "STOP");
		expect(sendDirectionSpy).not.toHaveBeenCalled();
	});

	it("sends the direction command on a long button press", () => {
		const rollerShutter = new RollerShutterAction();
		const settings = createSettings();

		rollerShutter.onKeyDown();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onKeyUp(createKeyUpEvent(settings));

		expect(sendDirectionSpy).toHaveBeenCalledWith("Blinds_1");
		expect(sendCommandSpy).not.toHaveBeenCalled();
	});

	it("sends STOP on a short dial push", () => {
		const rollerShutter = new RollerShutterAction();
		const settings = createSettings();

		rollerShutter.onDialDown();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
		rollerShutter.onDialUp(createDialUpEvent(settings));

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "STOP");
		expect(sendDirectionSpy).not.toHaveBeenCalled();
	});

	it("sends the direction command on a long dial push", () => {
		const rollerShutter = new RollerShutterAction();
		const settings = createSettings();

		rollerShutter.onDialDown();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		rollerShutter.onDialUp(createDialUpEvent(settings));

		expect(sendDirectionSpy).toHaveBeenCalledWith("Blinds_1");
		expect(sendCommandSpy).not.toHaveBeenCalled();
	});
});
