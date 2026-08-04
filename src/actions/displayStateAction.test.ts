import { afterEach, describe, expect, it, vi } from "vitest";
import { DisplayStateAction, DisplayStateSettings } from "./displayStateAction";
import actionManager from "@managers/actionManager";
import type {
	KeyAction,
	WillAppearEvent,
	WillDisappearEvent,
	DidReceiveSettingsEvent,
	KeyDownEvent
} from "@elgato/streamdeck";

function createSettings(): DisplayStateSettings {
	return { title: "Temp", itemName: "Temp_1", state: "21.5", latestCommand: "" };
}

function createAction(): KeyAction<DisplayStateSettings> {
	return { id: "action-1" } as unknown as KeyAction<DisplayStateSettings>;
}

describe("DisplayStateAction", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers itself and requests the current item state on will-appear", () => {
		const addSpy = vi.spyOn(actionManager, "addDisplayState").mockImplementation(() => undefined);
		const refreshSpy = vi.spyOn(actionManager, "refreshItemState").mockImplementation(() => undefined);
		const settings = createSettings();
		const action = createAction();
		const displayState = new DisplayStateAction();

		void displayState.onWillAppear({ action, payload: { settings } } as unknown as WillAppearEvent<DisplayStateSettings>);

		expect(addSpy).toHaveBeenCalledWith(action, settings);
		expect(refreshSpy).toHaveBeenCalledWith("Temp_1");
	});

	it("removes itself on will-disappear", () => {
		const removeSpy = vi.spyOn(actionManager, "remove").mockImplementation(() => undefined);
		const action = createAction();
		const displayState = new DisplayStateAction();

		void displayState.onWillDisappear({ action } as unknown as WillDisappearEvent<DisplayStateSettings>);

		expect(removeSpy).toHaveBeenCalledWith(action);
	});

	it("updates the tracked settings on did-receive-settings", () => {
		const updateSpy = vi.spyOn(actionManager, "updateDisplayState").mockImplementation(() => undefined);
		const settings = createSettings();
		const action = createAction();
		const displayState = new DisplayStateAction();

		void displayState.onDidReceiveSettings({ action, payload: { settings } } as unknown as DidReceiveSettingsEvent<DisplayStateSettings>);

		expect(updateSpy).toHaveBeenCalledWith(action, settings);
	});

	it("requests a fresh item state on key down", () => {
		const refreshSpy = vi.spyOn(actionManager, "refreshItemState").mockImplementation(() => undefined);
		const settings = createSettings();
		const action = createAction();
		const displayState = new DisplayStateAction();

		displayState.onKeyDown({ action, payload: { settings } } as unknown as KeyDownEvent<DisplayStateSettings>);

		expect(refreshSpy).toHaveBeenCalledWith("Temp_1");
	});
});
