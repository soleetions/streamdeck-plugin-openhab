import { afterEach, describe, expect, it, vi } from "vitest";
import { SendValueAction, SendValueSettings } from "./sendValueAction";
import actionManager from "@managers/actionManager";
import type {
	KeyAction,
	WillAppearEvent,
	WillDisappearEvent,
	DidReceiveSettingsEvent,
	KeyDownEvent
} from "@elgato/streamdeck";

function createSettings(): SendValueSettings {
	return { title: "Set 50%", itemName: "Blinds_1", state: "0", latestCommand: "", valueToSend: "50", valueType: "Percent" };
}

function createAction(): KeyAction<SendValueSettings> {
	return { id: "action-1" } as unknown as KeyAction<SendValueSettings>;
}

describe("SendValueAction", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers itself and requests the current item state on will-appear", () => {
		const addSpy = vi.spyOn(actionManager, "addSendValue").mockImplementation(() => undefined);
		const refreshSpy = vi.spyOn(actionManager, "refreshItemState").mockImplementation(() => undefined);
		const settings = createSettings();
		const action = createAction();
		const sendValue = new SendValueAction();

		void sendValue.onWillAppear({ action, payload: { settings } } as unknown as WillAppearEvent<SendValueSettings>);

		expect(addSpy).toHaveBeenCalledWith(action, settings);
		expect(refreshSpy).toHaveBeenCalledWith("Blinds_1");
	});

	it("removes itself on will-disappear", () => {
		const removeSpy = vi.spyOn(actionManager, "remove").mockImplementation(() => undefined);
		const action = createAction();
		const sendValue = new SendValueAction();

		void sendValue.onWillDisappear({ action } as unknown as WillDisappearEvent<SendValueSettings>);

		expect(removeSpy).toHaveBeenCalledWith(action);
	});

	it("updates the tracked settings on did-receive-settings", () => {
		const updateSpy = vi.spyOn(actionManager, "updateSendValue").mockImplementation(() => undefined);
		const settings = createSettings();
		const action = createAction();
		const sendValue = new SendValueAction();

		void sendValue.onDidReceiveSettings({ action, payload: { settings } } as unknown as DidReceiveSettingsEvent<SendValueSettings>);

		expect(updateSpy).toHaveBeenCalledWith(action, settings);
	});

	it("sends the configured value on key down, tagging it with the value's item type", () => {
		const sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
		const settings = createSettings();
		const action = createAction();
		const sendValue = new SendValueAction();

		sendValue.onKeyDown({ action, payload: { settings } } as unknown as KeyDownEvent<SendValueSettings>);

		expect(settings.itemType).toBe("Percent");
		expect(sendCommandSpy).toHaveBeenCalledWith(settings, "50");
	});
});
