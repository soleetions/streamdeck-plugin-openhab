import {
  isItemStateChangedEvent,
  ItemStateChangedEvent
} from "@interfaces/websocketMessages";
import actionManager from "@managers/actionManager";

/**
 * Receives the ItemStateChangedEvent for a single item from the OpenHAB server and updates the appropriate
 * Stream Deck action with the new data.
 */
export const handleItemStateChanged = (data: ItemStateChangedEvent) => {
  if (isItemStateChangedEvent(data)) {
    actionManager.handleItemState(data);
  }
};
