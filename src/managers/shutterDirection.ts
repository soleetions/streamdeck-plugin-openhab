export type ShutterDirection = "UP" | "DOWN";

/**
 * Determines the direction to send for a rollershutter long press: the
 * opposite of the direction that was sent last time, defaulting to `"UP"`
 * when nothing has been sent yet. The same value should be sent and
 * persisted as `latestCommand`, since it records the direction that was
 * actually sent. `latestCommand` is read as-is from settings, so it may be
 * undefined or empty on an instance that has never had a long press yet.
 * @param latestCommand The direction last sent, as currently persisted in settings.
 */
export function nextShutterDirection(latestCommand: string | undefined): ShutterDirection {
	return latestCommand === "UP" ? "DOWN" : "UP";
}
