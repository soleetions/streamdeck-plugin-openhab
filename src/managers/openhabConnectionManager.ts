import { EventEmitter } from "events";
import WebSocket from "ws";
import streamDeck from "@elgato/streamdeck";
import {
  OutgoingMessage,
  IncomingMessage,
  isItemStateChangedEvent,
  isWebSocketEvent,
  WebSocketEvent,
  isHeartbeatEvent
} from "@interfaces/websocketMessages";
import { Item } from "@interfaces/restMessages";

let logger = streamDeck.logger.createScope("OpenhabConnectionManager");

/**
 * Manages the websocket connection to OpenHAB.
 */
class OpenhabConnectionManager extends EventEmitter {

  private static instance: OpenhabConnectionManager | null;
  private socket: WebSocket | null = null;
  private heartbeatInterval = 1000 * 5; // 5 seconds

  private heartbeatTimer: NodeJS.Timeout | null = null;
  private apiToken: string = "";
  private serverHost: string = "";
  private serverPort: string = "";
  private websocketUrl: string = "";
  private restUrl: string = "";

  private items: String[] | null = null;

  //# Constructor
  private constructor() {
    super();
  }

  /**
   * Returns an singleton instance of the OpenhabConnectionManager.
   * If there is already an instance created, then the current one will be returned
   * 
   * @returns The websocket instance
   */
  public static getInstance(): OpenhabConnectionManager {
    if (!OpenhabConnectionManager.instance) {
      OpenhabConnectionManager.instance = new OpenhabConnectionManager();
      OpenhabConnectionManager.instance.connect();
    }
    return OpenhabConnectionManager.instance;
  }

  /**
   * Provides the current state of the connection to OpenHAB.
   * @returns true if there is an open connection to OpenHAB, false otherwise.
   */
  get isConnected() {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public updateSettings(settings: { serverHost?: string; serverPort?: string; apiKey?: string }) {
    logger.info(`Updated OpenHAB connection settings: ${JSON.stringify(settings)}`);

    this.serverHost = settings.serverHost ?? "";
    this.serverPort = settings.serverPort ?? "";
    this.apiToken = settings.apiKey ?? "";

    if (this.serverHost) {
      this.websocketUrl = `ws://${this.serverHost}:${this.serverPort}/ws?accessToken=${this.apiToken}`;
      this.restUrl = `http://${this.serverHost}:${this.serverPort}/rest`;
    }
    logger.info(`WebSocket URL: ${this.websocketUrl}`);
    logger.info(`REST URL: ${this.restUrl}`);

    // Optionally reconnect if settings changed
    this.disconnect();
    this.connect();
  }

  /**
   * Connects to the OpenHAB server and registers event handlers for various socket events.
   */
  public connect(): void {
    if (!this.websocketUrl || !this.restUrl) {
      logger.warn("OpenHAB connection settings not configured. Skipping connect.");
      return;
    }
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      logger.warn("WebSocket is already connected or connecting.");
      return;
    }

    // Cancel any pending heartbeat timer just in case there is one
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.socket = new WebSocket(this.websocketUrl);

    this.socket.on("open", () => {
      logger.debug("WebSocket connection established.");
      this.emit("connected");

      this.sendMessageFilter();

      this.scheduleHeartbeat();
    });

    this.socket.on("close", () => {
      logger.debug("WebSocket connection closed");

      this.emit("disconnected");
    });

    this.socket.on("error", (err: Error & { code: string }) => {
      logger.error("WebSocket error:", err.message);
    });

    this.socket.on("message", (message: string) => {
      this.processMessage(message);
    });
  }

  /**
   * Takes an incoming websocket message from the server
   * @param message The message to process
   */
  private processMessage(message: string): void {
    const data = JSON.parse(message) as IncomingMessage;
    if (isItemStateChangedEvent(data)) {
      this.emit("itemStateEvent", data);
    } else if (isHeartbeatEvent(data)) {
      // Ignore heartbeat messages
    } else if (isWebSocketEvent(data)) {
      this.logWebSocketEvent(data);
    }
  }

  /**
   * Sends a heartbeat message to the OpenHAB server to keep the websocket connection open
   */
  private scheduleHeartbeat(): void {
    this.heartbeatTimer = setTimeout(() => {
      // logger.debug(`Sending heartbeat to server`);

      this.sendMessage({
        type: "WebSocketEvent",
        source: "ElgatoStreamDeck",
        topic: "openhab/websocket/heartbeat",
        payload: "PING"
      });

      this.scheduleHeartbeat();
    }, this.heartbeatInterval);
  }

  private sendMessageFilter() {
    this.sendMessage({
      type: "WebSocketEvent",
      topic: "openhab/websocket/filter/type",
      payload: "[\"ItemStateChangedEvent\"]",
      source: "ElgatoStreamDeck"
    });
  }

  public sendMessage(message: OutgoingMessage) {
    if (this.socket == null) {
      logger.error("WebSocket to OpenHAB server not opened!")
      this.connect();
    } else {
      this.socket.send(JSON.stringify(message));
    }
  }

  public sendCommand(itemName: string, command: string | number) {
    fetch(`${this.restUrl}/items/${itemName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: command.toString()
    }).then(response => {
      if (!response.ok) {
        logger.error(`Failed to send command to item ${itemName}: ${response.status} ${response.statusText}`);
      } else {
        logger.debug(`Command sent to item ${itemName}: ${command}`);
      }
    });
  }

  /**
   * Disconnects from a OpenHAB instance.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public async getItems(): Promise<String[]> {
    if (!this.items) {
      logger.debug("Fetching items from OpenHAB");
      await this.refreshItems();
    }
    return this.items ?? [];
  }

  private async refreshItems() {
    if (!this.restUrl) {
      logger.warn("REST URL not configured. Cannot get item state.");
      return;
    }
    // wait for fetch to complete
    await fetch(`${this.restUrl}/items?fields=name`)
      .then(response => response.json())
      .then(data => {
        const openhabItems = data as Item[];
        this.items = openhabItems.map(item => item.name);
      });

    return this.items;
  }

  public getItemState(itemName: string): void {
    if (!this.restUrl) {
      logger.warn("REST URL not configured. Cannot get item state.");
      return;
    }
    fetch(`${this.restUrl}/items/${itemName}`)
      .then(response => response.json())
      .then(data => {
        const item = data as Item;
        logger.debug(`Item state received: ${JSON.stringify(item)}`);
        this.emit("itemStateEvent", {
          type: "ItemStateChangedEvent",
          topic: `openhab/items/${itemName}/statechanged`,
          payload: `{\"value\":\"${item.state}\"}`
        });
      });
  }

  private logWebSocketEvent(data: WebSocketEvent): void {
    logger.debug(`Received WebSocket event: ${JSON.stringify(data)}`);
  }

}

const openhabConnectionManagerInstance = OpenhabConnectionManager.getInstance();
export default openhabConnectionManagerInstance;
