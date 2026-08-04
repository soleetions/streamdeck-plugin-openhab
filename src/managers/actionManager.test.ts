import { afterEach, describe, expect, it, vi } from "vitest";
import actionManager from "./actionManager";
import openhabConnectionManager from "./openhabConnectionManager";
import type { KeyAction } from "@elgato/streamdeck";
import type { DisplayStateSettings } from "@actions/displayStateAction";
import type { SwitchSettings } from "@actions/switchAction";
import type { ItemStateChangedEvent } from "@interfaces/websocketMessages";

interface TestAction {
	id: string;
	isKey: () => boolean;
	isDial: () => boolean;
	setState: ReturnType<typeof vi.fn>;
	setTitle: ReturnType<typeof vi.fn>;
	getSettings: ReturnType<typeof vi.fn>;
	setSettings: ReturnType<typeof vi.fn>;
	showAlert: ReturnType<typeof vi.fn>;
}

function createTestAction(id: string): TestAction {
	return {
		id,
		isKey: () => true,
		isDial: () => false,
		setState: vi.fn(() => Promise.resolve()),
		setTitle: vi.fn(() => Promise.resolve()),
		getSettings: vi.fn(),
		setSettings: vi.fn(() => Promise.resolve()),
		showAlert: vi.fn(() => Promise.resolve())
	};
}

function asKeyAction<T>(action: TestAction): KeyAction<T> {
	return action as unknown as KeyAction<T>;
}

function displayStateSettings(itemName: string, state = "21.5"): DisplayStateSettings {
	return { title: "Temp", itemName, state, latestCommand: "" };
}

function switchSettings(itemName: string, state = "OFF"): SwitchSettings {
	return { title: "Light", itemName, state, latestCommand: "", itemType: "OnOff" };
}

describe("ActionManager", () => {
	afterEach(() => {
		actionManager.getActions().forEach((entry) => {
			actionManager.remove(entry.action);
		});
		vi.restoreAllMocks();
	});

	it("tracks a display state action added via addDisplayState and emits actionAdded", () => {
		const addedSpy = vi.fn();
		actionManager.once("actionAdded", addedSpy);
		const action = createTestAction("display-1");

		actionManager.addDisplayState(asKeyAction(action), displayStateSettings("Temp_1"));

		expect(actionManager.getDisplayStateControllers()).toHaveLength(1);
		expect(addedSpy).toHaveBeenCalled();
	});

	it("finds and updates a switch action's settings via updateSwitch", () => {
		const action = createTestAction("switch-1");
		actionManager.addSwitch(asKeyAction(action), switchSettings("Kitchen_Light"));

		actionManager.updateSwitch(asKeyAction(action), switchSettings("Kitchen_Light", "ON"));

		const [controller] = actionManager.getSwitchControllers();
		expect(controller.settings.state).toBe("ON");
	});

	it("requests a fresh item state when updateSwitch changes the item name", () => {
		const refreshSpy = vi.spyOn(openhabConnectionManager, "getItemState").mockImplementation(() => undefined);
		const action = createTestAction("switch-2");
		actionManager.addSwitch(asKeyAction(action), switchSettings("Kitchen_Light"));

		actionManager.updateSwitch(asKeyAction(action), switchSettings("Living_Room_Light"));

		expect(refreshSpy).toHaveBeenCalledWith("Living_Room_Light");
	});

	it("does nothing when updating settings for an action that isn't tracked", () => {
		expect(() => {
			actionManager.updateSwitch(asKeyAction(createTestAction("unknown")), switchSettings("Nowhere"));
		}).not.toThrow();
	});

	it("removes a tracked action and emits removed with the remaining count", () => {
		const removedSpy = vi.fn();
		actionManager.once("removed", removedSpy);
		const action = createTestAction("display-2");
		actionManager.addDisplayState(asKeyAction(action), displayStateSettings("Temp_2"));

		actionManager.remove(asKeyAction(action));

		expect(actionManager.getDisplayStateControllers()).toHaveLength(0);
		expect(removedSpy).toHaveBeenCalledWith(0);
	});

	it("parses a websocket item state event and updates the matching action's state", async () => {
		const action = createTestAction("display-3");
		action.getSettings.mockResolvedValue(displayStateSettings("Temp_3", "20.0"));
		actionManager.addDisplayState(asKeyAction(action), displayStateSettings("Temp_3", "20.0"));

		const event: ItemStateChangedEvent = {
			type: "ItemStateChangedEvent",
			topic: "openhab/items/Temp_3/statechanged",
			payload: '{"type":"Number","value":"22.5","oldValue":"20.0"}'
		};

		actionManager.handleItemState(event);

		await vi.waitFor(() => {
			expect(action.setSettings).toHaveBeenCalledWith(expect.objectContaining({ state: "22.5" }));
		});
		expect(action.setTitle).toHaveBeenLastCalledWith("22.5");
	});

	it("delegates sendCommand to the connection manager with the item name and command", () => {
		const sendSpy = vi.spyOn(openhabConnectionManager, "sendCommand").mockImplementation(() => undefined);

		actionManager.sendCommand(switchSettings("Kitchen_Light"), "ON");

		expect(sendSpy).toHaveBeenCalledWith("Kitchen_Light", "ON");
	});

	it("delegates getItems to the connection manager", async () => {
		vi.spyOn(openhabConnectionManager, "getItems").mockResolvedValue(["Kitchen_Light"]);

		await expect(actionManager.getItems()).resolves.toEqual(["Kitchen_Light"]);
	});

	it("shows an alert on every tracked action", () => {
		const action = createTestAction("display-4");
		actionManager.addDisplayState(asKeyAction(action), displayStateSettings("Temp_4"));

		actionManager.showAlertOnAll();

		expect(action.showAlert).toHaveBeenCalled();
	});
});
