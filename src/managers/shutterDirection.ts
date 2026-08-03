export type ShutterDirection = "UP" | "DOWN";

export interface ShutterDirectionResult {
	toSend: ShutterDirection;
	toPersist: ShutterDirection;
}

/**
 * Determines which direction to send for a rollershutter long press: the
 * opposite of the direction that was sent last time, defaulting to `"UP"`
 * when nothing has been sent yet. `toPersist` is always equal to `toSend`,
 * since `latestCommand` records the direction that was actually sent, not
 * the one queued for next time. `latestCommand` is read as-is from
 * settings, so it may be undefined or empty on an instance that has never
 * had a long press yet.
 * @param latestCommand The direction last sent, as currently persisted in settings.
 */
export function nextShutterDirection(latestCommand: string | undefined): ShutterDirectionResult {
	const toSend: ShutterDirection = latestCommand === "UP" ? "DOWN" : "UP";

	return { toSend, toPersist: toSend };
}
