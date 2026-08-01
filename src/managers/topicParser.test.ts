import { describe, expect, it } from "vitest";
import { extractItemName } from "./topicParser";

describe("extractItemName", () => {
	it("extracts the item name from a valid statechanged topic", () => {
		expect(extractItemName("openhab/items/Foo_Bar/statechanged")).toBe("Foo_Bar");
	});

	it("extracts item names containing digits and underscores", () => {
		expect(extractItemName("openhab/items/Living_Room_Light_2/statechanged")).toBe("Living_Room_Light_2");
	});

	it("returns an empty string when the topic does not match", () => {
		expect(extractItemName("openhab/things/Foo_Bar/statuschanged")).toBe("");
	});

	it("returns an empty string for an empty topic", () => {
		expect(extractItemName("")).toBe("");
	});
});
