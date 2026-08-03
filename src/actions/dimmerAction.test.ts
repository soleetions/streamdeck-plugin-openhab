import { describe, expect, it, vi } from "vitest";
import { DimmerAction, DimmerSettings } from "./dimmerAction";
import actionManager from "@managers/actionManager";
import type { KeyAction, KeyDownEvent } from "@elgato/streamdeck";

function createSettings(state: string): DimmerSettings {
	return { title: "Lamp", itemName: "Lamp_1", state, latestCommand: "", itemType: "Percentage" };
}

function createKeyDownEvent(settings: DimmerSettings): KeyDownEvent<DimmerSettings> {
	const action = { id: "dimmer-1" } as unknown as KeyAction<DimmerSettings>;
	return { action, payload: { settings } } as unknown as KeyDownEvent<DimmerSettings>;
}

describe("DimmerAction key press (regression: unaffected by DebouncedDialAction press hooks)", () => {
	it("still toggles ON immediately on key down when currently off", () => {
		const sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
		const dimmer = new DimmerAction();

		dimmer.onKeyDown(createKeyDownEvent(createSettings("0")));

		expect(sendCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ itemName: "Lamp_1" }), "ON");
		sendCommandSpy.mockRestore();
	});

	it("still toggles OFF immediately on key down when currently on", () => {
		const sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
		const dimmer = new DimmerAction();

		dimmer.onKeyDown(createKeyDownEvent(createSettings("50")));

		expect(sendCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ itemName: "Lamp_1" }), "OFF");
		sendCommandSpy.mockRestore();
	});
});
