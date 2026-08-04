import { afterEach, describe, expect, it, vi } from "vitest";
import streamDeck from "@elgato/streamdeck";
import { OpenhabAction } from "./openhabAction";
import actionManager from "@managers/actionManager";
import type { BaseSettings } from "@interfaces/itemSettings";
import type { SendToPluginEvent } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";

function createEvent(payload: JsonValue): SendToPluginEvent<JsonValue, BaseSettings> {
	return { payload } as unknown as SendToPluginEvent<JsonValue, BaseSettings>;
}

describe("OpenhabAction", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests items and forwards them sorted to the property inspector on an 'openhabItems' request", async () => {
		const getItemsSpy = vi.spyOn(actionManager, "getItems").mockResolvedValue(["Kitchen_Light", "Blinds_1"]);
		const sendSpy = vi.spyOn(streamDeck.ui, "sendToPropertyInspector").mockResolvedValue(undefined);
		const openhabAction = new OpenhabAction<BaseSettings>();

		void openhabAction.onSendToPlugin(createEvent({ event: "openhabItems" }));

		await vi.waitFor(() => {
			expect(sendSpy).toHaveBeenCalled();
		});
		expect(getItemsSpy).toHaveBeenCalled();
		expect(sendSpy).toHaveBeenCalledWith({
			event: "openhabItems",
			items: [
				{ value: "Blinds_1", label: "Blinds_1" },
				{ value: "Kitchen_Light", label: "Kitchen_Light" }
			]
		});
	});

	it("ignores payloads without a recognized event", () => {
		const getItemsSpy = vi.spyOn(actionManager, "getItems").mockResolvedValue([]);
		const openhabAction = new OpenhabAction<BaseSettings>();

		void openhabAction.onSendToPlugin(createEvent({ event: "somethingElse" }));

		expect(getItemsSpy).not.toHaveBeenCalled();
	});

	it("ignores non-object payloads", () => {
		const getItemsSpy = vi.spyOn(actionManager, "getItems").mockResolvedValue([]);
		const openhabAction = new OpenhabAction<BaseSettings>();

		void openhabAction.onSendToPlugin(createEvent("not an object"));

		expect(getItemsSpy).not.toHaveBeenCalled();
	});
});
