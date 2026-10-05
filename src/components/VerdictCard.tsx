import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { facts, Tone } from "../facts";
import { short } from "../mint";
import { C, F, verdictOf } from "../theme";

const TONE: Record<Tone, string> = { danger: C.danger, warn: C.warn, good: C.green, muted: "#3a3550" };
const open = (url: string) => Linking.openURL(url).catch(() => {});

type Props = { result: any; receipt: string | null; onPay: () => void; busy: boolean };

export function VerdictCard({ result, receipt, onPay, busy }: Props) {
  const v = verdictOf(result.label);
  const name = [result.token_name, result.token_symbol && result.token_symbol !== result.token_name ? `(${result.token_symbol})` : ""]
    .filter(Boolean)
    .join(" ");
  const gaps: string[] = result.not_established || [];

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={[s.ring, { borderColor: v.color }]}>
          <Text style={[s.ringNum, { color: v.color }]}>{typeof result.risk_score === "number" ? Math.round(result.risk_score) : "–"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { color: v.color }]}>{v.label}</Text>
          <Text style={s.name} numberOfLines={2}>{name || short(result.address)}</Text>
          <Text style={s.mint}>{short(result.address)}</Text>
        </View>
      </View>

      {!!result.verdict_summary && <Text style={s.summary}>{result.verdict_summary}</Text>}

      {facts(result).map((f, i) => (
        <View key={i} style={[s.fact, { borderLeftColor: TONE[f.tone] }]}>
          <Text style={[s.factHead, f.tone !== "muted" && { color: TONE[f.tone] }]}>{f.head.toUpperCase()}</Text>
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

      {gaps.length > 0 && (
        <View style={s.gaps}>
          <Text style={s.kicker}>NOT CHECKED</Text>
          {gaps.slice(0, 5).map((g) => (
            <Text key={g} style={s.gap}>· {g}</Text>
          ))}
        </View>
      )}

      {receipt ? (
        <Text style={s.paid} onPress={() => open(`https://solscan.io/tx/${receipt}`)}>
          PAID 0.01 USDC · x402 ON SOLANA · TX {short(receipt)} ↗
        </Text>
      ) : (
        <Pressable style={({ pressed }) => [s.pay, pressed && { opacity: 0.7 }]} onPress={onPay} disabled={busy}>
          <Text style={s.payText}>RE-SCAN · PAY $0.01 FROM WALLET</Text>
          <Text style={s.paySub}>x402 on Solana · charged only when a verdict comes back</Text>
        </Pressable>
      )}

      <View style={s.links}>
        <Text style={s.link} onPress={() => open(`https://solscan.io/token/${result.address}`)}>SOLSCAN ↗</Text>
        {result.creator_position?.creator && (
          <Text style={s.link} onPress={() => open(`https://solscan.io/account/${result.creator_position.creator}`)}>CREATOR ↗</Text>
        )}
        <Text style={s.link} onPress={() => open(`https://rugbuster.io/?mint=${result.address}`)}>WEB ↗</Text>
      </View>
      <Text style={s.foot}>Read from chain. Not financial advice.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 16 },
  ring: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  ringNum: { fontFamily: F.display, fontSize: 24 },
  label: { fontFamily: F.display, fontSize: 24, letterSpacing: 1 },
  name: { fontFamily: F.bodyBold, color: C.text, fontSize: 17, marginTop: 2 },
  mint: { fontFamily: F.mono, color: C.muted, fontSize: 11, marginTop: 2 },
  summary: { fontFamily: F.body, color: C.text, fontSize: 17, lineHeight: 23, marginTop: 16 },
  fact: { borderLeftWidth: 3, paddingLeft: 12, marginTop: 14 },
  factHead: { fontFamily: F.monoBold, color: C.soft, fontSize: 11, letterSpacing: 2 },
  factBody: { fontFamily: F.body, color: C.soft, fontSize: 16, lineHeight: 21, marginTop: 3 },
  proofRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 6 },
  proof: { fontFamily: F.monoBold, color: C.cyan, fontSize: 12 },
  gaps: { backgroundColor: "#0a0913", borderRadius: 12, padding: 12, marginTop: 16 },
  kicker: { fontFamily: F.monoBold, color: C.muted, fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  gap: { fontFamily: F.body, color: C.soft, fontSize: 15, lineHeight: 20 },
  pay: { marginTop: 18, borderWidth: 1, borderColor: C.purple, backgroundColor: "#1a0f33", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  payText: { fontFamily: F.monoBold, color: C.text, fontSize: 12, letterSpacing: 1 },
  paySub: { fontFamily: F.body, color: C.muted, fontSize: 12, marginTop: 3 },
  paid: { marginTop: 18, fontFamily: F.mono, color: C.green, fontSize: 11 },
  links: { flexDirection: "row", gap: 20, marginTop: 18 },
  link: { fontFamily: F.monoBold, color: C.cyan, fontSize: 12, letterSpacing: 1 },
  foot: { fontFamily: F.body, color: C.muted, fontSize: 12, marginTop: 10 },
});
