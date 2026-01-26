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

export type ItemSettings =
    | DisplayStateSettings
    | SendValueSettings
    | SwitchSettings
    | DimmerSettings
    | RollerShutterSettings
