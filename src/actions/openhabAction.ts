import streamDeck, { SendToPluginEvent, SingletonAction } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { BaseSettings } from "@interfaces/itemSettings";
import actionManager from "@managers/actionManager";

let logger = streamDeck.logger.createScope("OpenhabAction");

export class OpenhabAction<T extends BaseSettings> extends SingletonAction<T> {

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, T>): Promise<void> | void {
        if (typeof ev.payload === "object" && ev.payload !== null && "event" in ev.payload) {
            const eventType = (ev.payload as { event: string }).event;

            if (eventType === "openhabItems") {
                logger.debug("Refreshing items");
                const items = actionManager.getItems().then(items => {
                    streamDeck.ui.sendToPropertyInspector({
                        event: eventType,
                        items: items.sort()
                            .map(item => ({ value: item.toString(), label: item.toString() }))
                    });
                });
            }
        }
    }
}
