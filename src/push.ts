// Server push: the RugBuster API watches a tracked token's creator and tells
// this phone the moment they sell, through Firebase Cloud Messaging.
//
// Why: the background task below can only re-check when Android lets it, every
// 15 minutes at best and hours later on a sleeping Samsung. The server is told
// by Helius within seconds of the creator's transaction and pushes at once,
// with the app closed. The background task stays as the fallback for phones
// without Google Play services, and still reports a verdict that got worse.

import * as Notifications from "expo-notifications";
import { API } from "./api";

let cached: string | null = null;

// The Firebase device token, or null when this phone cannot receive pushes.
export async function deviceToken(): Promise<string | null> {
  if (cached) return cached;
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    if (token?.type === "android" && typeof token.data === "string" && token.data) {
      cached = token.data;
      return cached;
    }
  } catch {}
  return null;
}

// Ask the server to start (or stop) watching this token's creator for this
// phone. True when the server is now watching it.
export async function serverWatch(mint: string, on: boolean): Promise<boolean> {
  const token = await deviceToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API}/${on ? "watch" : "unwatch"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_token: token, mint }),
    });
    const data = await res.json().catch(() => null);
    return on ? !!data?.watching : false;
  } catch {
    return false;
  }
}
