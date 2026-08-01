import { DimmerSettings } from "@actions/dimmerAction";
import { DisplayStateSettings } from "@actions/displayStateAction";
import { RollerShutterSettings } from "@actions/rollerShutterAction";
import { SendValueSettings } from "@actions/sendValueAction";
import { SwitchSettings } from "@actions/switchAction";
import { JsonValue } from "@elgato/utils";

export interface BaseSettings {
    [key: string]: JsonValue;

    title: string,
    itemName: string,
    state: string,
    latestCommand: string
}

// DisplayStateSettings and RollerShutterSettings are currently structurally identical to
// BaseSettings, but are kept as separate constituents since they represent distinct action types.
export type ItemSettings =
    | DisplayStateSettings
    | SendValueSettings
    | SwitchSettings
    | DimmerSettings
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    | RollerShutterSettings
