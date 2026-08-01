/**
 * Extracts the item name from the given topic.
 *
 * @param topic full topic value
 * @returns Item name
 */
const ITEM_NAME_PATTERN = /openhab\/items\/([^/]+)\/state/;

export function extractItemName(topic: string): string {
  const match = ITEM_NAME_PATTERN.exec(topic);

  return match?.[1] ?? '';
}
