import { describe, expect, it } from "vitest";
import { nextShutterDirection } from "./shutterDirection";

describe("nextShutterDirection", () => {
	it("defaults to sending UP when no direction has been persisted yet", () => {
		expect(nextShutterDirection(undefined)).toEqual({ toSend: "UP", toPersist: "DOWN" });
	});

	it("defaults to sending UP when the persisted value is an empty string", () => {
		expect(nextShutterDirection("")).toEqual({ toSend: "UP", toPersist: "DOWN" });
	});

	it("sends UP and persists DOWN when the last persisted direction was UP", () => {
		expect(nextShutterDirection("UP")).toEqual({ toSend: "UP", toPersist: "DOWN" });
	});

	it("sends DOWN and persists UP when the last persisted direction was DOWN", () => {
		expect(nextShutterDirection("DOWN")).toEqual({ toSend: "DOWN", toPersist: "UP" });
	});

	it("alternates across repeated calls, matching a series of long presses", () => {
		let latest: string | undefined = undefined;
		const sentDirections: string[] = [];

		for (let i = 0; i < 4; i++) {
			const result = nextShutterDirection(latest);
			sentDirections.push(result.toSend);
			latest = result.toPersist;
		}

		expect(sentDirections).toEqual(["UP", "DOWN", "UP", "DOWN"]);
	});
});
