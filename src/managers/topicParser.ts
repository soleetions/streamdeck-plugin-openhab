/**
 * Extracts the item name from the given topic.
 *
 * @param topic full topic value
 * @returns Item name
 */
export function extractItemName(topic: string): string {
  const match = topic.match(/openhab\/items\/([^/]+)\/state/);

  if (match && match[1]) {
    return match[1];
  }
  return '';
}
