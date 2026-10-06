// Polyfills @solana/web3.js needs on React Native; they must load before it.
import "react-native-get-random-values";
import { Buffer } from "buffer";
(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;

// Defines the background watchlist task before the app starts.
import "./src/watch";

import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);
