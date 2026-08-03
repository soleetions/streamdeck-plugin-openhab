import { describe, expect, it, vi } from "vitest";
import { DisplayStateController, isDisplayStateController } from "./displayStateController";
import type { DisplayStateSettings } from "@actions/displayStateAction";
import type { KeyAction } from "@elgato/streamdeck";

interface TestAction {
	id: string;
	setTitle: ReturnType<typeof vi.fn>;
}

function createAction(): TestAction {
	return { id: "action-1", setTitle: vi.fn(() => Promise.resolve()) };
}

function asKeyAction(action: TestAction): KeyAction<DisplayStateSettings> {
	return action as unknown as KeyAction<DisplayStateSettings>;
}

function createSettings(state: string): DisplayStateSettings {
	return { title: "Temp", itemName: "Temp_1", state, latestCommand: "" };
}

describe("DisplayStateController", () => {
	it("sets the title to the current state on construction", () => {
		const action = createAction();
		new DisplayStateController(asKeyAction(action), createSettings("21.5"));
		expect(action.setTitle).toHaveBeenCalledWith("21.5");
	});

	it("updates the cached state and refreshes the title on setState", () => {
		const action = createAction();
		const controller = new DisplayStateController(asKeyAction(action), createSettings("21.5"));

		controller.setState("22.0");

		expect(controller.settings.state).toBe("22.0");
		expect(action.setTitle).toHaveBeenLastCalledWith("22.0");
	});

	it("defaults showTitle to false when not set", () => {
		const controller = new DisplayStateController(asKeyAction(createAction()), createSettings("21.5"));
		expect(controller.showTitle).toBe(false);
	});

	it("identifies DisplayStateController via the type guard", () => {
		const controller = new DisplayStateController(asKeyAction(createAction()), createSettings("21.5"));
		expect(isDisplayStateController(controller)).toBe(true);
	});
});
