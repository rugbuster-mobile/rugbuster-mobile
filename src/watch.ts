// Watchlist: tokens the user holds or follows, re-checked in the background.
//
// A creator's sale is pushed by the server the moment it happens (src/push.ts).
// The phone also re-checks every tracked token: it compares the new answer with
// the last one and turns a change worth knowing into a notification, a verdict
// that got worse, or a sale on a phone that cannot receive pushes. Android
// decides when that background check runs (every 15 minutes at best, hours on a
// sleeping Samsung); opening the app checks at once. The list stays on the phone.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { freeScan } from "./api";
import { serverWatch } from "./push";

export const WATCH_TASK = "rugbuster-watchlist-check";
const KEY = "rugbuster.watchlist.v1";
const RANK: Record<string, number> = { GOOD: 0, WARN: 1, DANGER: 2 };

export type Watched = {
  mint: string;
  symbol: string;
  label: string;
  score: number | null;
  creator: string | null; // creator_position.status: holding / sold / none
  checkedAt: number;
  alert?: string | null; // the last change found, shown in the app
  push?: boolean; // the server is watching the creator and will push the sale
};

export async function loadWatchlist(): Promise<Watched[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Watched[]) : [];
  } catch {
    return [];
  }
}

async function save(list: Watched[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

function snapshot(d: any, alert: string | null = null, push = false): Watched {
  return {
    push,
    mint: d.address,
    symbol: d.token_symbol || d.token_name || d.address.slice(0, 4),
    label: String(d.label || "UNKNOWN").toUpperCase(),
    score: typeof d.risk_score === "number" ? Math.round(d.risk_score) : null,
    creator: d.creator_position?.status || null,
    checkedAt: Date.now(),
    alert,
  };
}

export async function isWatched(mint: string) {
  return (await loadWatchlist()).some((w) => w.mint === mint);
}

// Returns at once with the new list, so the TRACK button lights immediately.
// Registering with the server takes a scan on its side (seconds); when it
// answers, the push flag is saved and `onUpdate` gets the list again.
export async function toggleWatch(d: any, onUpdate?: (list: Watched[]) => void): Promise<Watched[]> {
  const list = await loadWatchlist();
  const removing = list.some((w) => w.mint === d.address);
  const next = removing ? list.filter((w) => w.mint !== d.address) : [snapshot(d), ...list].slice(0, 50);
  await save(next);
  if (removing) {
    serverWatch(d.address, false);
  } else {
    ensureWatching()
      .then(() => serverWatch(d.address, true))
      .then(async (pushed) => {
        if (!pushed) return;
        const latest = (await loadWatchlist()).map((w) => (w.mint === d.address ? { ...w, push: true } : w));
        await save(latest);
        onUpdate?.(latest);
      })
      .catch(() => {});
  }
  return next;
}

// Tell the server again about every tracked token whose creator still holds:
// the phone's push token can change, and a token tracked before push existed
// was never registered. Cheap: one request per token, on app start.
export async function syncPush(): Promise<Watched[]> {
  const list = await loadWatchlist();
  const next: Watched[] = [];
  for (const w of list) {
    next.push(w.creator === "holding" ? { ...w, push: await serverWatch(w.mint, true) } : w);
  }
  const latest = await loadWatchlist();
  const merged = latest.map((l) => next.find((n) => n.mint === l.mint) || l);
  await save(merged);
  return merged;
}

// What changed between two answers, in one sentence, or null.
export function change(before: Watched, d: any): string | null {
  const sym = before.symbol;
  const cp = d.creator_position || {};
  if (cp.status === "sold" && before.creator !== "sold") {
    const share = cp.share_at_creation_pct ?? cp.peak_share_pct;
    return `The creator of ${sym} just sold${typeof share === "number" ? ` their ${share.toFixed(1)}%` : ""}.`;
  }
  const now = String(d.label || "").toUpperCase();
  if ((RANK[now] ?? -1) > (RANK[before.label] ?? -1) && now in RANK) {
    return `${sym} is now ${now === "WARN" ? "WARNING" : now}: ${d.verdict_summary || "see the app"}`;
  }
  return null;
}

// Re-check every watched token; notify on changes. Returns the updated list.
export async function checkWatchlist(notify: boolean): Promise<Watched[]> {
  const list = await loadWatchlist();
  const next: Watched[] = [];
  for (const w of list) {
    try {
      const d = await freeScan(w.mint);
      const msg = change(w, d);
      next.push(snapshot(d, msg || w.alert || null, !!w.push));
      // A creator sale on a server-watched token was already pushed by the server.
      const pushed = !!w.push && d.creator_position?.status === "sold" && w.creator !== "sold";
      if (msg && notify && !pushed) {
        await Notifications.scheduleNotificationAsync({
          content: { title: "RugBuster", body: msg, data: { mint: w.mint } },
          trigger: null,
        });
      }
    } catch {
      next.push(w);
    }
  }
  // keep any token added while this ran
  const latest = await loadWatchlist();
  const merged = [...next.filter((n) => latest.some((l) => l.mint === n.mint)), ...latest.filter((l) => !next.some((n) => n.mint === l.mint))];
  await save(merged);
  return merged;
}

export async function clearAlert(mint: string) {
  await save((await loadWatchlist()).map((w) => (w.mint === mint ? { ...w, alert: null } : w)));
}

// Defined at module load (imported from index.ts) so Android can run it
// while the app is closed.
TaskManager.defineTask(WATCH_TASK, async () => {
  try {
    await checkWatchlist(true);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function ensureWatching(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Watchlist alerts",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#14F195",
    }).catch(() => {});
  }
  const perm = await Notifications.getPermissionsAsync();
  const granted = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
  try {
    if (!(await TaskManager.isTaskRegisteredAsync(WATCH_TASK))) {
      await BackgroundTask.registerTaskAsync(WATCH_TASK, { minimumInterval: 15 });
    }
  } catch {}
  return granted;
}

// A sample alert a few seconds from now, to check that notifications reach this phone.
export async function testAlert() {
  await ensureWatching();
  await Notifications.scheduleNotificationAsync({
    content: { title: "RugBuster · test", body: "The creator of TOASTCAT just sold their 35.5%. (Test alert: this is what a watchlist alert looks like.)", data: { mint: "CqNJeUKi2feUBCbG2rARBQxh9BwUynoK5WrH6d8Bpump" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}
