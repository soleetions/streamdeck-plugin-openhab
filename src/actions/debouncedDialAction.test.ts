import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { DebouncedDialAction } from "./debouncedDialAction";
import { BaseSettings } from "@interfaces/itemSettings";

class TestDialAction extends DebouncedDialAction<BaseSettings> {
	public shortPressCalls: BaseSettings[] = [];
	public longPressCalls: BaseSettings[] = [];

	protected override onDebouncedRotate(): void {
		// Not exercised by these tests.
	}

	protected override onShortPress(settings: BaseSettings): void {
		this.shortPressCalls.push(settings);
	}

	protected override onLongPress(settings: BaseSettings): void {
		this.longPressCalls.push(settings);
	}

	public triggerPressDown(): void {
		this.handlePressDown();
	}

	public triggerPressUp(settings: BaseSettings): void {
		this.handlePressUp(settings);
	}
}

function createSettings(): BaseSettings {
	return { title: "Test", itemName: "Item_1", state: "0", latestCommand: "" };
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
		const settings = createSettings();

		action.triggerPressDown();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.499Z"));
		action.triggerPressUp(settings);

		expect(action.shortPressCalls).toEqual([settings]);
		expect(action.longPressCalls).toEqual([]);
	});

	it("treats a release at exactly 500ms as a long press", () => {
		const action = new TestDialAction();
		const settings = createSettings();

		action.triggerPressDown();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.500Z"));
		action.triggerPressUp(settings);

		expect(action.longPressCalls).toEqual([settings]);
		expect(action.shortPressCalls).toEqual([]);
	});

	it("treats a release well after the threshold as a long press", () => {
		const action = new TestDialAction();
		const settings = createSettings();

		action.triggerPressDown();
		vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
		action.triggerPressUp(settings);

		expect(action.longPressCalls).toEqual([settings]);
	});

	it("does nothing when a press-up occurs without a matching press-down", () => {
		const action = new TestDialAction();
		const settings = createSettings();

		action.triggerPressUp(settings);

		expect(action.shortPressCalls).toEqual([]);
		expect(action.longPressCalls).toEqual([]);
	});
});
