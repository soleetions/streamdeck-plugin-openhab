import { DialRotateEvent } from "@elgato/streamdeck";
import { BaseSettings } from "@interfaces/itemSettings";
import { OpenhabAction } from "./openhabAction";

export abstract class DebouncedDialAction<T extends BaseSettings> extends OpenhabAction<T> {
    private ticksAccumulator = 0;
    private debounceTimer: NodeJS.Timeout | null = null;

    private readonly debounceDelay: number = 800;

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

        this.debounceTimer = setTimeout(async () => {
            await this.onDebouncedRotate(ev, this.ticksAccumulator);

            this.debounceTimer = null;
            this.ticksAccumulator = 0;
        }, this.debounceDelay);
    }

    protected clamp(value: number, min: number = 0, max: number = 100): number {
        return Math.min(Math.max(value, min), max)
    }

}
