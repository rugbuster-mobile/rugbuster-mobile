// Where to write when something does not work. The message is prefilled with
// what we need to reproduce it, and nothing else leaves the phone.

import { Linking, Platform } from "react-native";
import Constants from "expo-constants";

export const TELEGRAM = "https://t.me/FFeyzer";
export const DISCORD = "https://discord.gg/v7nFJg7VyG";

function report(context: { mint?: string | null; error?: string | null }) {
  const v = Constants.expoConfig?.version || "?";
  const lines = [
    `RugBuster Android ${v} · ${Platform.OS} ${Platform.Version}`,
    context.mint ? `Token: ${context.mint}` : null,
    context.error ? `Error: ${context.error}` : null,
    "What happened:",
  ].filter(Boolean);
  return lines.join("\n");
}

// Telegram's share link opens a chat picker with the text prefilled; the user picks Fedja.
export function reportOnTelegram(context: { mint?: string | null; error?: string | null } = {}) {
  const text = encodeURIComponent(report(context));
  Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(TELEGRAM)}&text=${text}`).catch(() => Linking.openURL(TELEGRAM).catch(() => {}));
}

export function reportOnDiscord() {
  Linking.openURL(DISCORD).catch(() => {});
}
