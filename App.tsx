import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";
import { useShareIntent } from "expo-share-intent";
import { freeScan } from "./src/api";
import { facts, Tone } from "./src/facts";
import { Entry, loadHistory, remember } from "./src/history";
import { resolveMint, short } from "./src/mint";
import { payAndScan } from "./src/pay";

const C = {
  bg: "#06050c",
  panel: "#0d0b17",
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

const VERDICT: Record<string, { label: string; color: string }> = {
  DANGER: { label: "DANGER", color: C.danger },
  WARN: { label: "WARNING", color: C.warn },
  GOOD: { label: "NO FINDINGS", color: C.green },
};
const TONE: Record<Tone, string> = { danger: C.danger, warn: C.warn, good: C.green, muted: "#3a3550" };

const open = (url: string) => Linking.openURL(url).catch(() => {});

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const scan = useCallback(async (text: string) => {
    setError(null);
    setReceipt(null);
    setBusy("Finding the token…");
    try {
      const mint = await resolveMint(text);
      if (!mint) throw new Error("No Solana token address in that. Paste the mint address or a Solscan, pump.fun or DexScreener link.");
      setInput(mint);
      setBusy("Reading the chain…");
      const data = await freeScan(mint);
      setResult(data);
      setHistory(await remember(data));
    } catch (e: any) {
      setResult(null);
      setError(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }, []);

  // "Share → RugBuster" from Phantom, DexScreener, Solscan or any browser.
  useEffect(() => {
    if (!hasShareIntent) return;
    const text = shareIntent?.text || shareIntent?.webUrl || "";
    resetShareIntent();
    if (text) scan(text);
  }, [hasShareIntent, shareIntent, resetShareIntent, scan]);

  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setInput(text);
      scan(text);
    }
  };

  const pay = async () => {
    if (!result?.address) return;
    setError(null);
    try {
      const out = await payAndScan(result.address, setBusy);
      setResult(out.data);
      setReceipt(out.charged ? out.receiptTx : null);
      if (!out.charged) setError("No verdict for this token, so you were not charged.");
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  };

  const verdict = result ? VERDICT[String(result.label || "").toUpperCase()] || { label: "NO VERDICT", color: C.muted } : null;
  const name = result ? [result.token_name, result.token_symbol ? `(${result.token_symbol})` : ""].filter(Boolean).join(" ") : "";

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>
          RUG<Text style={{ color: C.cyan }}>BUSTER</Text>
        </Text>
        <Text style={s.tagline}>Spot the creator dump before you buy.</Text>

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Solana mint or link"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => scan(input)}
            returnKeyType="search"
          />
        </View>
        <View style={s.btnRow}>
          <Pressable style={[s.btn, s.btnGhost]} onPress={paste} disabled={!!busy}>
            <Text style={s.btnGhostText}>PASTE</Text>
          </Pressable>
          <Pressable style={[s.btn, s.btnMain]} onPress={() => scan(input)} disabled={!!busy || !input.trim()}>
            <Text style={s.btnMainText}>SCAN · FREE</Text>
          </Pressable>
        </View>
        <Text style={s.hint}>Or tap Share in Phantom, DexScreener or Solscan and pick RugBuster.</Text>

        {busy && (
          <View style={s.busy}>
            <ActivityIndicator color={C.green} />
            <Text style={s.busyText}>{busy}</Text>
          </View>
        )}
        {error && <Text style={s.error}>{error}</Text>}

        {result && verdict && !busy && (
          <View style={s.card}>
            <View style={[s.pill, { borderColor: verdict.color }]}>
              <Text style={[s.pillLabel, { color: verdict.color }]}>{verdict.label}</Text>
              {typeof result.risk_score === "number" && <Text style={[s.pillScore, { color: verdict.color }]}>{result.risk_score}/100</Text>}
            </View>
            <Text style={s.name}>{name || short(result.address)}</Text>
            <Text style={s.mint}>{short(result.address)}</Text>
            {!!result.verdict_summary && <Text style={s.summary}>{result.verdict_summary}</Text>}

            {facts(result).map((f, i) => (
              <View key={i} style={[s.fact, { borderLeftColor: TONE[f.tone] }]}>
                <Text style={s.factHead}>{f.head}</Text>
                <Text style={s.factBody}>{f.body}</Text>
                {f.proof.length > 0 && (
                  <View style={s.proofRow}>
                    {f.proof.map((p) => (
                      <Text key={p.href} style={s.proof} onPress={() => open(p.href)}>
                        {p.label} ↗
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {(result.not_established || []).length > 0 && (
              <View style={s.gaps}>
                <Text style={s.gapsHead}>NOT CHECKED</Text>
                {(result.not_established as string[]).slice(0, 5).map((g) => (
                  <Text key={g} style={s.gap}>· {g}</Text>
                ))}
              </View>
            )}

            {receipt ? (
              <Text style={s.paid} onPress={() => open(`https://solscan.io/tx/${receipt}`)}>
                PAID 0.01 USDC · x402 on Solana · tx {short(receipt)} ↗
              </Text>
            ) : (
              <Pressable style={[s.btn, s.btnPay]} onPress={pay}>
                <Text style={s.btnPayText}>RE-SCAN · PAY $0.01 FROM WALLET</Text>
              </Pressable>
            )}

            <View style={s.links}>
              <Text style={s.link} onPress={() => open(`https://solscan.io/token/${result.address}`)}>Solscan ↗</Text>
              <Text style={s.link} onPress={() => open(`https://rugbuster.io/?mint=${result.address}`)}>rugbuster.io ↗</Text>
            </View>
            <Text style={s.foot}>Read from chain. Not financial advice.</Text>
          </View>
        )}

        {history.length > 0 && (
          <View style={s.history}>
            <Text style={s.gapsHead}>RECENT SCANS</Text>
            {history.slice(0, 12).map((h) => {
              const v = VERDICT[h.label] || { label: h.label, color: C.muted };
              return (
                <Pressable key={h.mint} style={s.hRow} onPress={() => scan(h.mint)} disabled={!!busy}>
                  <Text style={[s.hLabel, { color: v.color }]}>{v.label}</Text>
                  <Text style={s.hName} numberOfLines={1}>{h.name || short(h.mint)}</Text>
                  <Text style={s.hMint}>{short(h.mint)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 48 },
  brand: { color: C.text, fontSize: 30, fontWeight: "900", letterSpacing: 3 },
  tagline: { color: C.soft, fontSize: 16, marginTop: 4, marginBottom: 20 },
  inputRow: { flexDirection: "row" },
  input: {
    flex: 1, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 10,
    color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "monospace",
  },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  btn: { borderRadius: 10, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  btnGhost: { flex: 1, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel },
  btnGhostText: { color: C.text, fontWeight: "700", letterSpacing: 2 },
  btnMain: { flex: 2, backgroundColor: C.green },
  btnMainText: { color: C.bg, fontWeight: "800", letterSpacing: 2 },
  hint: { color: C.muted, fontSize: 13, marginTop: 10 },
  busy: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22 },
  busyText: { color: C.soft, fontSize: 15 },
  error: { color: C.danger, marginTop: 18, fontSize: 14 },
  card: { marginTop: 22, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 14, padding: 16 },
  pill: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  pillLabel: { fontSize: 20, fontWeight: "900", letterSpacing: 2 },
  pillScore: { fontSize: 15, fontWeight: "700", fontFamily: "monospace" },
  name: { color: C.text, fontSize: 18, fontWeight: "700", marginTop: 14 },
  mint: { color: C.muted, fontFamily: "monospace", fontSize: 12, marginTop: 2 },
  summary: { color: C.soft, fontSize: 15, lineHeight: 22, marginTop: 12 },
  fact: { borderLeftWidth: 3, paddingLeft: 10, marginTop: 14 },
  factHead: { color: C.text, fontWeight: "700", fontSize: 14 },
  factBody: { color: C.soft, fontSize: 14, lineHeight: 20, marginTop: 2 },
  proofRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 6 },
  proof: { color: C.cyan, fontSize: 13, fontWeight: "600" },
  gaps: { backgroundColor: "#0a0913", borderRadius: 10, padding: 12, marginTop: 16 },
  gapsHead: { color: C.muted, fontSize: 11, letterSpacing: 2, marginBottom: 6, fontWeight: "700" },
  gap: { color: C.soft, fontSize: 13, lineHeight: 19 },
  btnPay: { marginTop: 16, borderWidth: 1, borderColor: C.purple, backgroundColor: "#1a0f33" },
  btnPayText: { color: C.text, fontWeight: "700", letterSpacing: 1, fontSize: 13 },
  paid: { marginTop: 16, color: C.green, fontFamily: "monospace", fontSize: 12 },
  links: { flexDirection: "row", gap: 18, marginTop: 16 },
  link: { color: C.cyan, fontWeight: "600" },
  foot: { color: C.muted, fontSize: 11, marginTop: 10 },
  history: { marginTop: 26 },
  hRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  hLabel: { width: 96, fontWeight: "800", fontSize: 12, letterSpacing: 1 },
  hName: { flex: 1, color: C.text, fontSize: 14 },
  hMint: { color: C.muted, fontFamily: "monospace", fontSize: 12 },
});
