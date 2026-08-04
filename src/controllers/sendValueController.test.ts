import { describe, expect, it, vi } from "vitest";
import { SendValueController, isSendValueController } from "./sendValueController";
import type { SendValueSettings } from "@actions/sendValueAction";
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

function asKeyAction(action: TestKeyAction): KeyAction<SendValueSettings> {
	return action as unknown as KeyAction<SendValueSettings>;
}

function createSettings(state: string, valueToSend: string): SendValueSettings {
	return { title: "Set 50%", itemName: "Blinds_1", state, latestCommand: "", valueToSend, valueType: "Percent" };
}

describe("SendValueController", () => {
	it("sets the title to 'Send' when refreshing (documents the current no-op concat behavior)", () => {
		const action = createAction();
		new SendValueController(asKeyAction(action), createSettings("50", "50"));
		expect(action.setTitle).toHaveBeenCalledWith("Send");
	});

	it("sets the key state to 1 when the current state matches the configured value", () => {
		const action = createAction();
		new SendValueController(asKeyAction(action), createSettings("50", "50"));
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("sets the key state to 0 when the current state does not match the configured value", () => {
		const action = createAction();
		new SendValueController(asKeyAction(action), createSettings("0", "50"));
		expect(action.setState).toHaveBeenCalledWith(0);
	});

	it("updates the cached state and refreshes on setState", () => {
		const action = createAction();
		const controller = new SendValueController(asKeyAction(action), createSettings("0", "50"));
		action.setState.mockClear();

		controller.setState("50");

		expect(controller.settings.state).toBe("50");
		expect(action.setState).toHaveBeenCalledWith(1);
	});

	it("identifies SendValueController via the type guard", () => {
		const controller = new SendValueController(asKeyAction(createAction()), createSettings("50", "50"));
		expect(isSendValueController(controller)).toBe(true);
	});
});
