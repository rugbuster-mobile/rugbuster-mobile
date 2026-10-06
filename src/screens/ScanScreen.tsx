import { RefObject } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Sphere, SphereHandle } from "../components/Sphere";
import { VerdictCard } from "../components/VerdictCard";
import { C, F } from "../theme";

const EXAMPLES = [
  { label: "CREATOR DUMP", mint: "CqNJeUKi2feUBCbG2rARBQxh9BwUynoK5WrH6d8Bpump" },
  { label: "BOT-SNIPED", mint: "97r4eHvQ6toSKX4NTx5R9Nm3Godu4VpGrVbv8XQbpump" },
  { label: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
];

type Props = {
  sphere: RefObject<SphereHandle | null>;
  input: string;
  setInput: (s: string) => void;
  busy: string | null;
  error: string | null;
  result: any;
  receipt: string | null;
  onScan: (text: string) => void;
  onPaste: () => void;
  onPay: () => void;
  watched: boolean;
  onWatch: () => void;
  alerts: number;
  onAlerts: () => void;
};

export function ScanScreen({ sphere, input, setInput, busy, error, result, receipt, onScan, onPaste, onPay, watched, onWatch, alerts, onAlerts }: Props) {
  return (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.top}>
        <Text style={s.brand}>
          RUG<Text style={{ color: C.cyan }}>BUSTER</Text>
        </Text>
        <View style={s.net}>
          <View style={s.dot} />
          <Text style={s.netText}>SOLANA</Text>
        </View>
      </View>

      {alerts > 0 && (
        <Pressable style={s.alertBanner} onPress={onAlerts}>
          <Text style={s.alertBannerText}>⚠ {alerts} ALERT{alerts > 1 ? "S" : ""} ON YOUR TRACKED TOKENS · VIEW</Text>
        </Pressable>
      )}

      <View>
        <Sphere ref={sphere} height={300} />
        <Text style={s.status}>{busy ? busy.toUpperCase() : result ? "TRACE COMPLETE" : "READY · PASTE A MINT"}</Text>
      </View>

      <Text style={s.headline}>Spot the creator dump{"\n"}before you buy.</Text>

      <View style={s.inputBox}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Mint address or link"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => onScan(input)}
          returnKeyType="search"
        />
        <Pressable onPress={onPaste} hitSlop={10} style={s.pasteBtn}>
          <Ionicons name="clipboard-outline" size={20} color={C.cyan} />
        </Pressable>
      </View>

      <View style={s.actions}>
        <Pressable
          style={({ pressed }) => [s.scanBtn, (pressed || !!busy) && { opacity: 0.75 }]}
          onPress={() => onScan(input)}
          disabled={!!busy || !input.trim()}
        >
          {busy ? <ActivityIndicator color={C.bg} /> : <Text style={s.scanText}>SCAN · FREE</Text>}
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.trackBtn, watched && s.trackOn, (pressed || !!busy || !input.trim()) && { opacity: 0.6 }]}
          onPress={onWatch}
          disabled={!!busy || !input.trim()}
        >
          <Ionicons name={watched ? "notifications" : "notifications-outline"} size={18} color={watched ? C.bg : C.green} />
          <Text style={[s.trackText, watched && { color: C.bg }]}>{watched ? "TRACKING" : "TRACK"}</Text>
        </Pressable>
      </View>
      {result && !busy && !watched && <Text style={s.trackHint}>Track = alert me when the creator sells or the verdict gets worse.</Text>}

      <View style={s.chips}>
        {EXAMPLES.map((e) => (
          <Pressable key={e.mint} style={s.chip} onPress={() => onScan(e.mint)} disabled={!!busy}>
            <Text style={s.chipText}>TRY: {e.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.hint}>Tip: in Phantom, DexScreener or Solscan tap Share → RugBuster.</Text>

      {error && (
        <View style={s.errBox}>
          <Text style={s.error}>{error}</Text>
          {!!input.trim() && !busy && (
            <Pressable onPress={() => onScan(input)} style={s.retry}>
              <Text style={s.retryText}>TRY AGAIN</Text>
            </Pressable>
          )}
        </View>
      )}
      {result && !busy && <VerdictCard result={result} receipt={receipt} onPay={onPay} busy={!!busy} watched={watched} onWatch={onWatch} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 140 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontFamily: F.display, color: C.text, fontSize: 20, letterSpacing: 2 },
  net: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  netText: { fontFamily: F.monoBold, color: C.green, fontSize: 10, letterSpacing: 2 },
  alertBanner: { marginTop: 14, borderWidth: 1, borderColor: C.danger, backgroundColor: "#1c0a12", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  alertBannerText: { fontFamily: F.monoBold, color: C.danger, fontSize: 11, letterSpacing: 1.5 },
  status: { position: "absolute", bottom: 6, alignSelf: "center", fontFamily: F.mono, color: C.muted, fontSize: 11, letterSpacing: 3 },
  headline: { fontFamily: F.bodyBold, color: C.text, fontSize: 26, lineHeight: 30, textAlign: "center", marginTop: 6, marginBottom: 18 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 14 },
  input: { flex: 1, color: C.text, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontFamily: F.mono },
  pasteBtn: { paddingHorizontal: 14 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  scanBtn: { flex: 2, backgroundColor: C.green, borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  trackBtn: { flex: 1, flexDirection: "row", gap: 6, borderWidth: 1.5, borderColor: C.green, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  trackOn: { backgroundColor: C.green },
  trackText: { fontFamily: F.display, color: C.green, fontSize: 12, letterSpacing: 1.5 },
  trackHint: { fontFamily: F.body, color: C.muted, fontSize: 13, textAlign: "center", marginTop: 8 },
  scanText: { fontFamily: F.display, color: C.bg, fontSize: 15, letterSpacing: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14, justifyContent: "center" },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  chipText: { fontFamily: F.monoBold, color: C.soft, fontSize: 10, letterSpacing: 1.5 },
  hint: { fontFamily: F.body, color: C.muted, fontSize: 14, textAlign: "center", marginTop: 12 },
  errBox: { marginTop: 16, alignItems: "center", gap: 10 },
  error: { fontFamily: F.body, color: C.danger, fontSize: 15, textAlign: "center" },
  retry: { borderWidth: 1, borderColor: C.danger, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
  retryText: { fontFamily: F.monoBold, color: C.danger, fontSize: 12, letterSpacing: 2 },
});
