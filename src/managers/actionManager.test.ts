import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import actionManager from "./actionManager";
import type { RollerShutterSettings } from "@actions/rollerShutterAction";
import type { KeyAction } from "@elgato/streamdeck";

function createFakeAction(id: string, initialSettings: RollerShutterSettings): KeyAction<RollerShutterSettings> {
	let currentSettings = initialSettings;

	const fakeAction = {
		id,
		isKey: () => true,
		isDial: () => false,
		getSettings: vi.fn(() => Promise.resolve(currentSettings)),
		setSettings: vi.fn((newSettings: RollerShutterSettings) => {
			currentSettings = newSettings;
			return Promise.resolve();
		}),
		setState: vi.fn(() => Promise.resolve()),
		setFeedback: vi.fn(() => Promise.resolve())
	};

	return fakeAction as unknown as KeyAction<RollerShutterSettings>;
}

function flushMicrotasks(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}

describe("ActionManager.sendShutterDirectionCommand", () => {
	let sendCommandSpy: MockInstance<typeof actionManager.sendCommand>;

	beforeEach(() => {
		sendCommandSpy = vi.spyOn(actionManager, "sendCommand").mockImplementation(() => undefined);
	});

	afterEach(() => {
		sendCommandSpy.mockRestore();
		actionManager.getActions().slice().forEach(controller => {
			actionManager.remove(controller.action);
		});
	});

	it("sends UP and persists DOWN the first time, when latestCommand is unset", async () => {
		const settings: RollerShutterSettings = { title: "Blinds", itemName: "Blinds_1", state: "50", latestCommand: "" };
		const action = createFakeAction("action-1", settings);
		actionManager.addRollerShutter(action, settings);

		actionManager.sendShutterDirectionCommand(action);
		await flushMicrotasks();

		expect(sendCommandSpy).toHaveBeenCalledWith(
			expect.objectContaining({ itemName: "Blinds_1", latestCommand: "DOWN" }),
			"UP"
		);
	});

	it("alternates direction across repeated calls on the same instance", async () => {
		const settings: RollerShutterSettings = { title: "Blinds", itemName: "Blinds_2", state: "50", latestCommand: "" };
		const action = createFakeAction("action-2", settings);
		actionManager.addRollerShutter(action, settings);

		actionManager.sendShutterDirectionCommand(action);
		await flushMicrotasks();
		actionManager.sendShutterDirectionCommand(action);
		await flushMicrotasks();

		expect(sendCommandSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ itemName: "Blinds_2" }), "UP");
		expect(sendCommandSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ itemName: "Blinds_2" }), "DOWN");
	});

	it("only affects the pressed instance when multiple controllers share an item", async () => {
		const settingsA: RollerShutterSettings = { title: "A", itemName: "Blinds_3", state: "50", latestCommand: "UP" };
		const settingsB: RollerShutterSettings = { title: "B", itemName: "Blinds_3", state: "50", latestCommand: "DOWN" };
		const actionA = createFakeAction("action-3a", settingsA);
		const actionB = createFakeAction("action-3b", settingsB);
		actionManager.addRollerShutter(actionA, settingsA);
		actionManager.addRollerShutter(actionB, settingsB);

		actionManager.sendShutterDirectionCommand(actionA);
		await flushMicrotasks();

		expect(sendCommandSpy).toHaveBeenCalledTimes(1);
		expect(sendCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ itemName: "Blinds_3", latestCommand: "DOWN" }), "UP");

		const settingsAfterB = await actionB.getSettings();
		expect(settingsAfterB.latestCommand).toBe("DOWN");
	});

	it("does nothing when no controller is registered for the pressed action", async () => {
		const settings: RollerShutterSettings = { title: "Orphan", itemName: "Blinds_4", state: "50", latestCommand: "" };
		const action = createFakeAction("action-4", settings);

		actionManager.sendShutterDirectionCommand(action);
		await flushMicrotasks();

		expect(sendCommandSpy).not.toHaveBeenCalled();
	});
});
