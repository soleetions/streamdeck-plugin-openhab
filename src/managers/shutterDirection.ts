export type ShutterDirection = "UP" | "DOWN";

export interface ShutterDirectionResult {
	toSend: ShutterDirection;
	toPersist: ShutterDirection;
}

/**
 * Determines which direction to send for a rollershutter long press, and
 * which direction should be persisted as the one to send on the press after
 * that. `latestCommand` is read as-is from settings, so it may be undefined
 * or empty on an instance that has never had a long press yet.
 * @param latestCommand The direction currently persisted in settings.
 */
export function nextShutterDirection(latestCommand: string | undefined): ShutterDirectionResult {
	const toSend: ShutterDirection = latestCommand === "DOWN" ? "DOWN" : "UP";
	const toPersist: ShutterDirection = toSend === "UP" ? "DOWN" : "UP";

	return { toSend, toPersist };
}
