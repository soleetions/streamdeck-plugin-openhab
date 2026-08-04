import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` is hoisted above every `import` statement in this file (including a
// top-level `import { EventEmitter } from "events"`), so a class defined in here can't
// reference an imported `EventEmitter` without hitting a temporal-dead-zone error. A
// minimal inline emitter (just on/once/emit, which is all the fake socket needs) sidesteps
// that entirely.
const wsState = vi.hoisted(() => {
	class MiniEmitter {
		private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

		on(event: string, listener: (...args: unknown[]) => void) {
			const set = this.listeners.get(event) ?? new Set();
			set.add(listener);
			this.listeners.set(event, set);
			return this;
		}

		once(event: string, listener: (...args: unknown[]) => void) {
			const wrapped = (...args: unknown[]) => {
				this.off(event, wrapped);
				listener(...args);
			};
			return this.on(event, wrapped);
		}

		off(event: string, listener: (...args: unknown[]) => void) {
			this.listeners.get(event)?.delete(listener);
			return this;
		}

		emit(event: string, ...args: unknown[]) {
			for (const listener of this.listeners.get(event) ?? []) {
				listener(...args);
			}
			return true;
		}
	}

	class FakeWebSocket extends MiniEmitter {
		static CONNECTING = 0;
		static OPEN = 1;
		static CLOSING = 2;
		static CLOSED = 3;
		static instances: FakeWebSocket[] = [];

		readyState = FakeWebSocket.CONNECTING;
		sent: string[] = [];
		url: string;

		constructor(url: string) {
			super();
			this.url = url;
			FakeWebSocket.instances.push(this);
		}

		send(data: string) {
			this.sent.push(data);
		}

		close() {
			this.readyState = FakeWebSocket.CLOSED;
			this.emit("close");
		}
	}

	return { FakeWebSocket };
});

vi.mock("ws", () => ({ default: wsState.FakeWebSocket }));

const { default: openhabConnectionManager } = await import("./openhabConnectionManager");

function connectWithSettings() {
	openhabConnectionManager.updateSettings({ serverHost: "openhab.local", serverPort: "8080", apiKey: "token" });
	const instance = wsState.FakeWebSocket.instances.at(-1);
	if (!instance) {
		throw new Error("Expected a FakeWebSocket instance to have been created");
	}
	return instance;
}

describe("OpenhabConnectionManager", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		wsState.FakeWebSocket.instances.length = 0;
	});

	afterEach(() => {
		openhabConnectionManager.disconnect();
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("does not open a socket until server settings are configured", () => {
		openhabConnectionManager.connect();
		expect(wsState.FakeWebSocket.instances).toHaveLength(0);
	});

	it("builds the websocket URL from the provided settings", () => {
		const socket = connectWithSettings();
		expect(socket.url).toBe("ws://openhab.local:8080/ws?accessToken=token");
	});

	it("sends the message type filter and schedules a heartbeat once the socket opens", () => {
		const socket = connectWithSettings();
		socket.readyState = wsState.FakeWebSocket.OPEN;

		socket.emit("open");

		expect(socket.sent).toHaveLength(1);
		expect(JSON.parse(socket.sent[0]) as unknown).toMatchObject({ topic: "openhab/websocket/filter/type" });

		vi.advanceTimersByTime(5000);

		expect(socket.sent).toHaveLength(2);
		expect(JSON.parse(socket.sent[1]) as unknown).toMatchObject({ topic: "openhab/websocket/heartbeat", payload: "PING" });
	});

	it("emits itemStateEvent when a matching message is received", () => {
		const socket = connectWithSettings();
		const eventSpy = vi.fn();
		openhabConnectionManager.once("itemStateEvent", eventSpy);

		socket.emit(
			"message",
			JSON.stringify({
				type: "ItemStateChangedEvent",
				topic: "openhab/items/Kitchen_Light/statechanged",
				payload: '{"type":"OnOff","value":"ON","oldValue":"OFF"}'
			})
		);

		expect(eventSpy).toHaveBeenCalledWith(
			expect.objectContaining({ topic: "openhab/items/Kitchen_Light/statechanged" })
		);
	});

	it("schedules a reconnect with exponential backoff after the socket closes unexpectedly", () => {
		connectWithSettings();
		const first = wsState.FakeWebSocket.instances.at(-1);
		if (!first) throw new Error("expected first socket");

		// connect()'s reconnect guard checks readyState !== CLOSED, so the fake must
		// reach CLOSED before emitting "close", mirroring real `ws` behavior.
		first.readyState = wsState.FakeWebSocket.CLOSED;
		first.emit("close");
		vi.advanceTimersByTime(1000);
		expect(wsState.FakeWebSocket.instances).toHaveLength(2);

		const second = wsState.FakeWebSocket.instances.at(-1);
		if (!second) throw new Error("expected second socket");

		second.readyState = wsState.FakeWebSocket.CLOSED;
		second.emit("close");
		vi.advanceTimersByTime(2000);
		expect(wsState.FakeWebSocket.instances).toHaveLength(3);
	});

	it("reports isConnected only when the socket is open", () => {
		const socket = connectWithSettings();
		expect(openhabConnectionManager.isConnected).toBe(false);

		socket.readyState = wsState.FakeWebSocket.OPEN;
		expect(openhabConnectionManager.isConnected).toBe(true);
	});

	it("posts the command to the REST API for the configured item", async () => {
		connectWithSettings();
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: "OK" });
		vi.stubGlobal("fetch", fetchMock);

		openhabConnectionManager.sendCommand("Kitchen_Light", "ON");

		await vi.waitFor(() => {
			expect(fetchMock).toHaveBeenCalled();
		});
		expect(fetchMock).toHaveBeenCalledWith(
			"http://openhab.local:8080/rest/items/Kitchen_Light",
			expect.objectContaining({ method: "POST", body: "ON" })
		);
	});

	it("fetches and caches the item list, reusing the cache on subsequent calls", async () => {
		connectWithSettings();
		const fetchMock = vi.fn().mockResolvedValue({
			json: () => Promise.resolve([{ name: "Kitchen_Light" }, { name: "Blinds_1" }])
		});
		vi.stubGlobal("fetch", fetchMock);

		const items = await openhabConnectionManager.getItems();
		expect(items).toEqual(["Kitchen_Light", "Blinds_1"]);

		await openhabConnectionManager.getItems();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("emits itemStateEvent with the fetched item's state on getItemState", async () => {
		connectWithSettings();
		const fetchMock = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ name: "Kitchen_Light", state: "ON", type: "Switch", label: "Kitchen", link: "" })
		});
		vi.stubGlobal("fetch", fetchMock);
		const eventSpy = vi.fn();
		openhabConnectionManager.once("itemStateEvent", eventSpy);

		openhabConnectionManager.getItemState("Kitchen_Light");

		await vi.waitFor(() => {
			expect(eventSpy).toHaveBeenCalled();
		});
		expect(eventSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				topic: "openhab/items/Kitchen_Light/statechanged",
				payload: '{"value":"ON"}'
			})
		);
	});
});
