import { describe, expect, it, vi } from "vitest";
import { SwitchController, isSwitchController } from "./switchController";
import type { SwitchSettings } from "@actions/switchAction";
import type { KeyAction } from "@elgato/streamdeck";

interface TestKeyAction {
	id: string;
	isKey: () => boolean;
	isDial: () => boolean;
	setState: ReturnType<typeof vi.fn>;
	setTitle: ReturnType<typeof vi.fn>;
}

function createAction(): TestKeyAction {
	return {
		id: "action-1",
		isKey: () => true,
		isDial: () => false,
		setState: vi.fn(() => Promise.resolve()),
		setTitle: vi.fn(() => Promise.resolve())
	};
}

function asKeyAction(action: TestKeyAction): KeyAction<SwitchSettings> {
	return action as unknown as KeyAction<SwitchSettings>;
}

function createSettings(state: string): SwitchSettings {
	return { title: "Kitchen Light", itemName: "Kitchen_Light", state, latestCommand: "", itemType: "OnOff" };
}

describe("SwitchController", () => {
	it("reports switched on when state is ON", () => {
		const controller = new SwitchController(asKeyAction(createAction()), createSettings("ON"));
		expect(controller.isSwitchedOn()).toBe(true);
	});

	it("reports switched off when state is OFF", () => {
		const controller = new SwitchController(asKeyAction(createAction()), createSettings("OFF"));
		expect(controller.isSwitchedOn()).toBe(false);
	});

	it("sets the key state to 1 when refreshing a switched-on action", () => {
		const action = createAction();
		new SwitchController(asKeyAction(action), createSettings("ON"));
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("updates the cached state and refreshes the key state on setState", () => {
		const action = createAction();
		const controller = new SwitchController(asKeyAction(action), createSettings("OFF"));
		action.setState.mockClear();

		controller.setState("ON");

		expect(controller.settings.state).toBe("ON");
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("identifies SwitchController via the type guard", () => {
		const controller = new SwitchController(asKeyAction(createAction()), createSettings("ON"));
		expect(isSwitchController(controller)).toBe(true);
	});
});
