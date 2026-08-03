import { DialRotateEvent } from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import { OpenhabAction } from "./openhabAction";

export abstract class DebouncedDialAction<T extends BaseSettings> extends OpenhabAction<T> {
    private ticksAccumulator = 0;
    private debounceTimer: NodeJS.Timeout | null = null;
    private pressStart: Date | null = null;

    private readonly debounceDelay: number = 800;
    private readonly longPressThreshold: number = 500;

    /**
     * Subclass needs to implement what happens after the debounce
     */
    protected abstract onDebouncedRotate(
        ev: DialRotateEvent<T>,
        totalTicks: number
    ): void | Promise<void>;

    /**
     * Optional hook for live feedback on dial rotate.
     */
    protected onIntermediateRotate?(
        ev: DialRotateEvent<T>,
        accumulatedTicks: number
    ): void;

    /**
     * Method handles all the debounce logic
     */
    protected handleDialRotate(ev: DialRotateEvent<T>): void {

        this.ticksAccumulator += ev.payload.ticks;
        this.onIntermediateRotate?.(ev, this.ticksAccumulator);

        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            void (async () => {
                await this.onDebouncedRotate(ev, this.ticksAccumulator);

                this.debounceTimer = null;
                this.ticksAccumulator = 0;
            })();
        }, this.debounceDelay);
    }

    protected clamp(value: number, min = 0, max = 100): number {
        return Math.min(Math.max(value, min), max)
    }

    /**
     * Records the moment a key or dial was pressed down, for later duration
     * comparison in {@link handlePressUp}.
     */
    protected handlePressDown(): void {
        this.pressStart = new Date();
    }

    /**
     * Determines whether the press that just ended was short or long
     * relative to {@link longPressThreshold}, and invokes the corresponding
     * hook. Does nothing if there was no matching {@link handlePressDown}.
     */
    protected handlePressUp(settings: T): void {
        if (this.pressStart === null) {
            return;
        }

        const elapsedMs = new Date().getTime() - this.pressStart.getTime();
        this.pressStart = null;

        if (elapsedMs < this.longPressThreshold) {
            this.onShortPress?.(settings);
        } else {
            this.onLongPress?.(settings);
        }
    }

    /**
     * Optional hook invoked when a press was released before the long-press
     * threshold.
     */
    protected onShortPress?(settings: T): void;

    /**
     * Optional hook invoked when a press was held past the long-press
     * threshold.
     */
    protected onLongPress?(settings: T): void;

}
