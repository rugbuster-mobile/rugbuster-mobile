// The last scans, kept on the phone only. Nothing here leaves the device.

import AsyncStorage from "@react-native-async-storage/async-storage";

export type Entry = { mint: string; label: string; score: number | null; name: string; at: number };

const KEY = "rugbuster.history.v1";
const LIMIT = 30;

export async function loadHistory(): Promise<Entry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}

export async function remember(d: any): Promise<Entry[]> {
  const entry: Entry = {
    mint: d.address,
    label: String(d.label || "UNKNOWN").toUpperCase(),
    score: typeof d.risk_score === "number" ? d.risk_score : null,
    name: d.token_symbol || d.token_name || "",
    at: Date.now(),
  };
  const next = [entry, ...(await loadHistory()).filter((e) => e.mint !== entry.mint)].slice(0, LIMIT);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}
