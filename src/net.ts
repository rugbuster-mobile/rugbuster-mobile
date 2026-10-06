// Network calls that survive the trip to the wallet app and back.
//
// While Phantom is on screen, some Android builds (Xiaomi's among them) cut
// network access for the app in the background, and the first request after
// coming back fails with "Unable to resolve host". So: wait until the app is
// in front again, and retry a network failure a few times before giving up.

import { AppState } from "react-native";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function untilActive(timeoutMs = 6000): Promise<void> {
  if (AppState.currentState === "active") return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, timeoutMs);
    const sub = AppState.addEventListener("change", (s) => s === "active" && done());
    function done() {
      clearTimeout(timer);
      sub.remove();
      resolve();
    }
  });
}

export const OFFLINE = "No internet connection. Check Wi-Fi or mobile data and try again.";

export async function netFetch(url: string, init?: RequestInit, tries = 4): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    await untilActive();
    try {
      return await fetch(url, init);
    } catch (e) {
      last = e;
      await sleep(800 * (i + 1));
    }
  }
  const msg = String((last as any)?.message || last || "");
  throw new Error(/resolve host|network request failed|unknownhost|failed to connect|timeout/i.test(msg) ? OFFLINE : msg || OFFLINE);
}
