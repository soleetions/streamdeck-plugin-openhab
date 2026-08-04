import { describe, expect, it, vi } from "vitest";
import { BaseController } from "./baseController";
import type { KeyAction } from "@elgato/streamdeck";

class TestController extends BaseController {
	type = "TestController";
	refreshTitle(): void {
		// no-op for testing the base class's own behavior
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- abstract method stub signature must match BaseController
	setState(state: string): void {
		// no-op for testing the base class's own behavior
	}
}

interface TestAction {
	id: string;
	setTitle: ReturnType<typeof vi.fn>;
}

function createAction(): TestAction {
	return { id: "action-1", setTitle: vi.fn(() => Promise.resolve()) };
}

function asKeyAction(action: TestAction): KeyAction {
	return action as unknown as KeyAction;
}

describe("BaseController", () => {
	it("stores the action and item name from the constructor", () => {
		const action = createAction();
		const controller = new TestController(asKeyAction(action), "Item_1");

		expect(controller.action).toBe(asKeyAction(action));
		expect(controller.itemName).toBe("Item_1");
	});

	it("sets the title on the underlying action", () => {
		const action = createAction();
		const controller = new TestController(asKeyAction(action), "Item_1");

		controller.setTitle("Hello");

		expect(action.setTitle).toHaveBeenCalledWith("Hello");
	});

	it("does not throw when the underlying setTitle call rejects", async () => {
		const action = createAction();
		// eslint-disable-next-line @typescript-eslint/no-misused-promises -- deliberately rejecting mock to test setTitle's error handling
		action.setTitle.mockImplementation(() => Promise.reject(new Error("boom")));
		const controller = new TestController(asKeyAction(action), "Item_1");

		expect(() => {
			controller.setTitle("Hello");
		}).not.toThrow();
		await vi.waitFor(() => {
			expect(action.setTitle).toHaveBeenCalled();
		});
	});
});
