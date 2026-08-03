import { describe, expect, it } from "vitest";
import { nextShutterDirection } from "./shutterDirection";

describe("nextShutterDirection", () => {
	it("defaults to UP when no direction has been sent yet", () => {
		expect(nextShutterDirection(undefined)).toBe("UP");
	});

	it("defaults to UP when the persisted value is an empty string", () => {
		expect(nextShutterDirection("")).toBe("UP");
	});

	it("returns DOWN when the last sent direction was UP", () => {
		expect(nextShutterDirection("UP")).toBe("DOWN");
	});

	it("returns UP when the last sent direction was DOWN", () => {
		expect(nextShutterDirection("DOWN")).toBe("UP");
	});

	it("alternates across repeated calls, matching a series of long presses", () => {
		let latest: string | undefined = undefined;
		const sentDirections: string[] = [];

		for (let i = 0; i < 4; i++) {
			const direction = nextShutterDirection(latest);
			sentDirections.push(direction);
			latest = direction;
		}

		expect(sentDirections).toEqual(["UP", "DOWN", "UP", "DOWN"]);
	});
});
