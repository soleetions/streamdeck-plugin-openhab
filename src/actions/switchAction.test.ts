import { afterEach, describe, expect, it, vi } from "vitest";
import { SwitchAction, SwitchSettings } from "./switchAction";
import actionManager from "@managers/actionManager";
import type {
	KeyAction,
	WillAppearEvent,
	WillDisappearEvent,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	DialDownEvent
} from "@elgato/streamdeck";

function createSettings(state: string): SwitchSettings {
	return { title: "Kitchen Light", itemName: "Kitchen_Light", state, latestCommand: "", itemType: "OnOff" };
}

function createAction(): KeyAction<SwitchSettings> {
	return { id: "action-1" } as unknown as KeyAction<SwitchSettings>;
}

describe("SwitchAction", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers itself and requests the current item state on will-appear", () => {
		const addSpy = vi.spyOn(actionManager, "addSwitch").mockImplementation(() => undefined);
		const refreshSpy = vi.spyOn(actionManager, "refreshItemState").mockImplementation(() => undefined);
		const settings = createSettings("OFF");
		const action = createAction();
		const switchAction = new SwitchAction();

		void switchAction.onWillAppear({ action, payload: { settings } } as unknown as WillAppearEvent<SwitchSettings>);

		expect(addSpy).toHaveBeenCalledWith(action, settings);
		expect(refreshSpy).toHaveBeenCalledWith("Kitchen_Light");
	});

	it("removes itself on will-disappear", () => {
		const removeSpy = vi.spyOn(actionManager, "remove").mockImplementation(() => undefined);
		const action = createAction();
		const switchAction = new SwitchAction();

		void switchAction.onWillDisappear({ action } as unknown as WillDisappearEvent<SwitchSettings>);

		expect(removeSpy).toHaveBeenCalledWith(action);
	});

	it("updates the tracked settings on did-receive-settings", () => {
		const updateSpy = vi.spyOn(actionManager, "updateSwitch").mockImplementation(() => undefined);
		const settings = createSettings("OFF");
		const action = createAction();
		const switchAction = new SwitchAction();

		void switchAction.onDidReceiveSettings({ action, payload: { settings } } as unknown as DidReceiveSettingsEvent<SwitchSettings>);

		expect(updateSpy).toHaveBeenCalledWith(action, settings);
	});

	it("sends ON on key down when currently OFF", () => {
		const sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
		const settings = createSettings("OFF");
		const action = createAction();
		const switchAction = new SwitchAction();

		switchAction.onKeyDown({ action, payload: { settings } } as unknown as KeyDownEvent<SwitchSettings>);

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "ON");
	});

	it("sends OFF on dial down when currently ON", () => {
		const sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
		const settings = createSettings("ON");
		const action = createAction();
		const switchAction = new SwitchAction();

		void switchAction.onDialDown({ action, payload: { settings } } as unknown as DialDownEvent<SwitchSettings>);

		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "OFF");
	});
});
