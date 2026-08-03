import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { DebouncedDialAction, PressAction } from "./debouncedDialAction";
import { BaseSettings } from "@interfaces/itemSettings";
import type { KeyAction } from "@elgato/streamdeck";

class TestDialAction extends DebouncedDialAction<BaseSettings> {
	public shortPressCalls: { actionId: string; settings: BaseSettings }[] = [];
	public longPressCalls: { actionId: string; settings: BaseSettings }[] = [];

	protected override onDebouncedRotate(): void {
		// Not exercised by these tests.
	}

	protected override onShortPress(action: PressAction<BaseSettings>, settings: BaseSettings): void {
		this.shortPressCalls.push({ actionId: action.id, settings });
	}

	protected override onLongPress(action: PressAction<BaseSettings>, settings: BaseSettings): void {
		this.longPressCalls.push({ actionId: action.id, settings });
	}

	public triggerPressDown(action: PressAction<BaseSettings>): void {
		this.handlePressDown(action);
	}

	public triggerPressUp(action: PressAction<BaseSettings>, settings: BaseSettings): void {
		this.handlePressUp(action, settings);
	}
}

function createSettings(): BaseSettings {
	return { title: "Test", itemName: "Item_1", state: "0", latestCommand: "" };
}

function createFakeAction(id: string): PressAction<BaseSettings> {
	return { id } as unknown as KeyAction<BaseSettings>;
}

describe("DebouncedDialAction press handling", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("treats a release before 500ms as a short press", () => {
		const action = new TestDialAction();
		const fakeAction = createFakeAction("action-1");
		const settings = createSettings();

		action.triggerPressDown(fakeAction);
		vi.setSystemTime(new Date("2026-01-01T00:00:00.499Z"));
		action.triggerPressUp(fakeAction, settings);

		expect(action.shortPressCalls).toEqual([{ actionId: "action-1", settings }]);
		expect(action.longPressCalls).toEqual([]);
	});

	it("treats a release at exactly 500ms as a long press", () => {
		const action = new TestDialAction();
		const fakeAction = createFakeAction("action-1");
		const settings = createSettings();

		action.triggerPressDown(fakeAction);
		vi.setSystemTime(new Date("2026-01-01T00:00:00.500Z"));
		action.triggerPressUp(fakeAction, settings);

		expect(action.longPressCalls).toEqual([{ actionId: "action-1", settings }]);
		expect(action.shortPressCalls).toEqual([]);
	});

	it("treats a release well after the threshold as a long press", () => {
		const action = new TestDialAction();
		const fakeAction = createFakeAction("action-1");
		const settings = createSettings();

		action.triggerPressDown(fakeAction);
		vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
		action.triggerPressUp(fakeAction, settings);

		expect(action.longPressCalls).toEqual([{ actionId: "action-1", settings }]);
	});

	it("does nothing when a press-up occurs without a matching press-down", () => {
		const action = new TestDialAction();
		const fakeAction = createFakeAction("action-1");
		const settings = createSettings();

		action.triggerPressUp(fakeAction, settings);

		expect(action.shortPressCalls).toEqual([]);
		expect(action.longPressCalls).toEqual([]);
	});

	it("tracks overlapping presses on different action instances independently", () => {
		const action = new TestDialAction();
		const fakeActionA = createFakeAction("action-a");
		const fakeActionB = createFakeAction("action-b");
		const settingsA = createSettings();
		const settingsB = createSettings();

		action.triggerPressDown(fakeActionA);
		vi.setSystemTime(new Date("2026-01-01T00:00:00.100Z"));
		action.triggerPressDown(fakeActionB);

		vi.setSystemTime(new Date("2026-01-01T00:00:00.300Z"));
		action.triggerPressUp(fakeActionA, settingsA);

		vi.setSystemTime(new Date("2026-01-01T00:00:00.700Z"));
		action.triggerPressUp(fakeActionB, settingsB);

		expect(action.shortPressCalls).toEqual([{ actionId: "action-a", settings: settingsA }]);
		expect(action.longPressCalls).toEqual([{ actionId: "action-b", settings: settingsB }]);
	});
});
