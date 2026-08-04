import { describe, expect, it, vi } from "vitest";
import { RollerShutterController, isRollerShutterController } from "./rollerShutterController";
import type { RollerShutterSettings } from "@actions/rollerShutterAction";
import type { DialAction, KeyAction } from "@elgato/streamdeck";

interface TestKeyAction {
	id: string;
	isKey: () => boolean;
	isDial: () => boolean;
	setState: ReturnType<typeof vi.fn>;
	setTitle: ReturnType<typeof vi.fn>;
}

interface TestDialAction {
	id: string;
	isKey: () => boolean;
	isDial: () => boolean;
	setFeedback: ReturnType<typeof vi.fn>;
	setTitle: ReturnType<typeof vi.fn>;
}

function createKeyAction(): TestKeyAction {
	return {
		id: "key-1",
		isKey: () => true,
		isDial: () => false,
		setState: vi.fn(() => Promise.resolve()),
		setTitle: vi.fn(() => Promise.resolve())
	};
}

function createDialAction(): TestDialAction {
	return {
		id: "dial-1",
		isKey: () => false,
		isDial: () => true,
		setFeedback: vi.fn(() => Promise.resolve()),
		setTitle: vi.fn(() => Promise.resolve())
	};
}

function asKeyAction(action: TestKeyAction): KeyAction<RollerShutterSettings> {
	return action as unknown as KeyAction<RollerShutterSettings>;
}

function asDialAction(action: TestDialAction): DialAction<RollerShutterSettings> {
	return action as unknown as DialAction<RollerShutterSettings>;
}

function createSettings(state: string): RollerShutterSettings {
	return { title: "Blinds", itemName: "Blinds_1", state, latestCommand: "" };
}

describe("RollerShutterController", () => {
	it("reports switched on when state is a positive percentage", () => {
		const controller = new RollerShutterController(asKeyAction(createKeyAction()), createSettings("50"));
		expect(controller.isSwitchedOn()).toBe(true);
	});

	it("reports switched off when state is zero", () => {
		const controller = new RollerShutterController(asKeyAction(createKeyAction()), createSettings("0"));
		expect(controller.isSwitchedOn()).toBe(false);
	});

	it("sets the key state to 1 when refreshing a switched-on key action", () => {
		const action = createKeyAction();
		new RollerShutterController(asKeyAction(action), createSettings("50"));
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("sets dial feedback with the percentage value when refreshing a dial action", () => {
		const action = createDialAction();
		new RollerShutterController(asDialAction(action), createSettings("75"));
		expect(action.setFeedback).toHaveBeenCalledWith({ indicator: "75", value: "75%" });
	});

	it("updates the cached state and refreshes the key state on setState", () => {
		const action = createKeyAction();
		const controller = new RollerShutterController(asKeyAction(action), createSettings("0"));
		action.setState.mockClear();

		controller.setState("100");

		expect(controller.settings.state).toBe("100");
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("identifies RollerShutterController via the type guard", () => {
		const controller = new RollerShutterController(asKeyAction(createKeyAction()), createSettings("50"));
		expect(isRollerShutterController(controller)).toBe(true);
	});
});
