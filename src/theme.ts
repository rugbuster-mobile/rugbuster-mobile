export const C = {
  bg: "#06050c",
  panel: "#0d0b17",
  panel2: "#121022",
  line: "#231d3d",
  text: "#ece9f7",
  muted: "#8b86a6",
  soft: "#b9b4d1",
  purple: "#9945ff",
  green: "#14f195",
  cyan: "#19d3ff",
  danger: "#ff3d6e",
  warn: "#ffc24b",
};

// Loaded in App.tsx from @expo-google-fonts.
export const F = {
  display: "Orbitron_900Black",
  displayBold: "Orbitron_700Bold",
  body: "Rajdhani_500Medium",
  bodyBold: "Rajdhani_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoBold: "JetBrainsMono_700Bold",
};

export const VERDICT: Record<string, { label: string; color: string }> = {
  DANGER: { label: "DANGER", color: C.danger },
  WARN: { label: "WARNING", color: C.warn },
  GOOD: { label: "NO FINDINGS", color: C.green },
};

export const verdictOf = (label?: string | null) =>
  VERDICT[String(label || "").toUpperCase()] || { label: "NO VERDICT", color: C.muted };

export function ago(iso: string | number): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return Math.round(s / 60) + "m";
  if (s < 86400) return Math.round(s / 3600) + "h";
  return Math.round(s / 86400) + "d";
}
