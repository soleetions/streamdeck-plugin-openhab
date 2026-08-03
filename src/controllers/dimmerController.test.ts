import { describe, expect, it, vi } from "vitest";
import { DimmerController, isDimmerController } from "./dimmerController";
import type { DimmerSettings } from "@actions/dimmerAction";
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

function asKeyAction(action: TestKeyAction): KeyAction<DimmerSettings> {
	return action as unknown as KeyAction<DimmerSettings>;
}

function asDialAction(action: TestDialAction): DialAction<DimmerSettings> {
	return action as unknown as DialAction<DimmerSettings>;
}

function createSettings(state: string): DimmerSettings {
	return { title: "Lamp", itemName: "Lamp_1", state, latestCommand: "", itemType: "Percentage" };
}

describe("DimmerController", () => {
	it("reports switched on when state is a positive percentage", () => {
		const controller = new DimmerController(asKeyAction(createKeyAction()), createSettings("50"));
		expect(controller.isSwitchedOn()).toBe(true);
	});

	it("reports switched off when state is zero", () => {
		const controller = new DimmerController(asKeyAction(createKeyAction()), createSettings("0"));
		expect(controller.isSwitchedOn()).toBe(false);
	});

	it("sets the key state to 1 when refreshing a switched-on key action", () => {
		const action = createKeyAction();
		new DimmerController(asKeyAction(action), createSettings("50"));
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("sets dial feedback with the percentage value when refreshing a dial action", () => {
		const action = createDialAction();
		new DimmerController(asDialAction(action), createSettings("75"));
		expect(action.setFeedback).toHaveBeenCalledWith({ indicator: "75", value: "75%" });
	});

	it("updates the cached state and refreshes the key state on setState", () => {
		const action = createKeyAction();
		const controller = new DimmerController(asKeyAction(action), createSettings("0"));
		action.setState.mockClear();

		controller.setState("100");

		expect(controller.settings.state).toBe("100");
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("defaults showTitle to false when not set", () => {
		const controller = new DimmerController(asKeyAction(createKeyAction()), createSettings("0"));
		expect(controller.showTitle).toBe(false);
	});

	it("identifies DimmerController via the type guard", () => {
		const controller = new DimmerController(asKeyAction(createKeyAction()), createSettings("0"));
		expect(isDimmerController(controller)).toBe(true);
	});
});
