import { describe, expect, it } from "vitest";
import {
	isHeartbeatEvent,
	isItemStateChangedEvent,
	isWebSocketEvent,
	IncomingMessage,
	WebSocketEvent,
} from "./websocketMessages";

describe("isItemStateChangedEvent", () => {
	it("returns true for an ItemStateChangedEvent", () => {
		const message: IncomingMessage = {
			type: "ItemStateChangedEvent",
			topic: "openhab/items/*/statechanged",
			payload: "{\"value\":\"ON\"}",
		};

		expect(isItemStateChangedEvent(message)).toBe(true);
	});

	it("returns false for a message of a different type", () => {
		const message: IncomingMessage = {
			type: "WebSocketEvent",
			source: "ElgatoStreamDeck",
			payload: "PONG",
		};

		expect(isItemStateChangedEvent(message)).toBe(false);
	});
});

describe("isHeartbeatEvent", () => {
	it("returns true when the payload is PONG", () => {
		const message: WebSocketEvent = {
			type: "WebSocketEvent",
			source: "ElgatoStreamDeck",
			payload: "PONG",
		};

		expect(isHeartbeatEvent(message)).toBe(true);
	});

	it("returns false when the payload is not PONG", () => {
		const message: WebSocketEvent = {
			type: "WebSocketEvent",
			source: "ElgatoStreamDeck",
			payload: "PING",
		};

		expect(isHeartbeatEvent(message)).toBe(false);
	});
});

describe("isWebSocketEvent", () => {
	it("returns true for a WebSocketEvent", () => {
		const message: IncomingMessage = {
			type: "WebSocketEvent",
			source: "ElgatoStreamDeck",
			payload: "PONG",
		};

		expect(isWebSocketEvent(message)).toBe(true);
	});

	it("returns false for a message of a different type", () => {
		const message: IncomingMessage = {
			type: "ItemStateChangedEvent",
			topic: "openhab/items/*/statechanged",
			payload: "{\"value\":\"ON\"}",
		};

		expect(isWebSocketEvent(message)).toBe(false);
	});
});
