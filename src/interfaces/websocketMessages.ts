export interface Event {
  source: "ElgatoStreamDeck"
}

export interface WebSocketEvent extends Event {
  type: "WebSocketEvent",
  payload: string
}

/**
 * Represents the Heartbeat message to the OpenHAB server.
 */
export interface Heartbeat extends WebSocketEvent {
  topic: "openhab/websocket/heartbeat",
  payload: "PING" | "PONG"
}

/**
 * Represents the Heartbeat message to the OpenHAB server.
 */
export interface MessageFilter extends WebSocketEvent {
  topic: "openhab/websocket/filter/type",
  payload: "[\"ItemStateChangedEvent\"]"
}

/**
 * Represents the Item State event to the OpenHAB server to refresh the latest state
 */
export interface RefreshItemState extends Event {
  type: "ItemStateEvent",
  topic: string
}

/**
 * Represents the Item State event to the OpenHAB server to refresh the latest state
 */
export interface ItemCommandEvent extends Event {
  type: "ItemCommandEvent",
  topic: string,
  payload: string
}

/**
 * Type union for all possible outgoing websocket messages to the OpenHAB server.
 */
export type OutgoingMessage =
  | Heartbeat
  | MessageFilter
  | RefreshItemState
  | ItemCommandEvent;


export interface Payload {
  type: string,
  value: string,
  oldValue: string
}

export interface ItemStateChangedEvent {
  type: "ItemStateChangedEvent",
  topic: "openhab/items/*/statechanged",
  payload: string
}

export type IncomingMessage =
  | ItemStateChangedEvent
  | WebSocketEvent
  | Heartbeat;

/**
 * Typeguard for ItemStateChangedEvent.
 * @param message The message
 * @returns True if the message is a ItemStateChangedEvent
 */
export function isItemStateChangedEvent(
  message: IncomingMessage
): message is ItemStateChangedEvent {
  return message.type === "ItemStateChangedEvent";
}

export function isHeartbeatEvent(
  message: WebSocketEvent
): message is Heartbeat {
  return message.payload === "PONG";
}

export function isWebSocketEvent(
  message: IncomingMessage
): message is WebSocketEvent {
  return message.type === "WebSocketEvent";
}
