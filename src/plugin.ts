import streamDeck from "@elgato/streamdeck";

import openhabConnectionManager from "@managers/openhabConnectionManager"
import { DisplayStateAction } from "@actions/displayStateAction";
import { handleItemStateChanged } from "./eventHandlers/itemStateChanged";
import { SendValueAction } from "@actions/sendValueAction";
import { SwitchAction } from "@actions/switchAction";
import { DimmerAction } from "@actions/dimmerAction";
import { RollerShutterAction } from "@actions/rollerShutterAction";

streamDeck.settings.getGlobalSettings();

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("debug");
openhabConnectionManager.connect();

// Register the actions.
streamDeck.actions.registerAction(new DisplayStateAction());
streamDeck.actions.registerAction(new SendValueAction());
streamDeck.actions.registerAction(new SwitchAction());
streamDeck.actions.registerAction(new DimmerAction());
streamDeck.actions.registerAction(new RollerShutterAction());

openhabConnectionManager.on("itemStateEvent", handleItemStateChanged);

streamDeck.settings.onDidReceiveGlobalSettings((settings) => {
    streamDeck.logger.debug("Received global settings:", settings);
    openhabConnectionManager.updateSettings(settings.settings);
});

// Finally, connect to the Stream Deck.
streamDeck.connect(); 
