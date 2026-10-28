// Anonymous usage counts (2026-10-28): one small event when the app opens, scans,
// tracks, connects a wallet, gets Pro or pays. The id is random and made on this
// phone; no wallet address, token or device detail is sent. Fire and forget: a
// failed count never touches what the user sees.

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { API } from "./api";

const KEY = "rugbuster.usage.id";
const VERSION = Constants.expoConfig?.version || "";
let id: string | null = null;
let lastOpen = 0;

async function usageId(): Promise<string> {
  if (id) return id;
  id = await AsyncStorage.getItem(KEY).catch(() => null);
  if (!id) {
    const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
    id = Array.from({ length: 16 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
    await AsyncStorage.setItem(KEY, id).catch(() => {});
  }
  return id;
}

export type UsageEvent = "open" | "scan" | "track" | "connect" | "pro" | "pay";

export function count(ev: UsageEvent) {
  if (ev === "open") {
    const now = Date.now();
    if (now - lastOpen < 30 * 60 * 1000) return; // one open per half hour
    lastOpen = now;
  }
  usageId()
    .then((dev) => fetch(`${API}/app/event`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dev, ev, v: VERSION }) }))
    .catch(() => {});
}
