// Polyfills @solana/web3.js needs on React Native; they must load before it.
import "react-native-get-random-values";
import { Buffer } from "buffer";
(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;

import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);
