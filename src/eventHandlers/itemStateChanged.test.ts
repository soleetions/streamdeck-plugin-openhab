import { afterEach, describe, expect, it, vi } from "vitest";
import { handleItemStateChanged } from "./itemStateChanged";
import actionManager from "@managers/actionManager";
import type { ItemStateChangedEvent } from "@interfaces/websocketMessages";

describe("handleItemStateChanged", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("forwards a valid ItemStateChangedEvent to the action manager", () => {
		const handleSpy = vi.spyOn(actionManager, "handleItemState").mockImplementation(() => undefined);
		const event: ItemStateChangedEvent = {
			type: "ItemStateChangedEvent",
			topic: "openhab/items/Kitchen_Light/statechanged",
			payload: '{"type":"OnOff","value":"ON","oldValue":"OFF"}'
		};

		handleItemStateChanged(event);

		expect(handleSpy).toHaveBeenCalledWith(event);
	});

	it("ignores events that are not ItemStateChangedEvents", () => {
		const handleSpy = vi.spyOn(actionManager, "handleItemState").mockImplementation(() => undefined);
		const event = {
			type: "WebSocketEvent",
			topic: "openhab/websocket/heartbeat",
			payload: "PONG"
		} as unknown as ItemStateChangedEvent;

		handleItemStateChanged(event);

		expect(handleSpy).not.toHaveBeenCalled();
	});
});
