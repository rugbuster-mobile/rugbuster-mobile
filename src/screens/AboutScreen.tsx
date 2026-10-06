import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { C, F } from "../theme";
import { reportOnDiscord, reportOnTelegram } from "../support";

const open = (url: string) => Linking.openURL(url).catch(() => {});

const ROWS: [string, string][] = [
  ["The creation transaction", "How much of the supply the creator bought when the token was made, and whether and how fast they sold it."],
  ["The first five seconds", "Every wallet that bought before a person could react, and which of them are bot wallets."],
  ["The creator's record and funding", "Earlier tokens by the same creator, and who sent the creator the SOL to launch."],
  ["Contract and holders", "What the token's authorities can still do, and who holds the supply."],
  ["What it could not check", "Listed every time. A gap is never shown as clean."],
];

const LINKS: [string, string][] = [
  ["rugbuster.io", "https://rugbuster.io"],
  ["X · @RugBusterAI", "https://x.com/RugBusterAI"],
  ["Discord", "https://discord.gg/v7nFJg7VyG"],
  ["Telegram · founder", "https://t.me/FFeyzer"],
  ["API for wallets and bots", "https://rugbuster.io/#builders"],
  ["Privacy", "https://rugbuster.io/privacy/"],
];

export function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.kicker}>HOW A SCAN WORKS</Text>
      <Text style={s.title}>Read the creator, not the contract.</Text>
      {ROWS.map(([h, b], i) => (
        <View key={h} style={s.row}>
          <Text style={s.n}>0{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.rowHead}>{h}</Text>
            <Text style={s.rowBody}>{b}</Text>
          </View>
        </View>
      ))}

      <Text style={s.kicker2}>SOMETHING NOT WORKING?</Text>
      <Text style={s.body}>Tell us. A scan that looks wrong, an alert that did not arrive, a payment that failed: write, and we fix it.</Text>
      <View style={s.supportRow}>
        <Pressable style={s.supportBtn} onPress={() => reportOnTelegram()}>
          <Text style={s.supportText}>REPORT ON TELEGRAM</Text>
        </Pressable>
        <Pressable style={[s.supportBtn, { borderColor: C.purple }]} onPress={reportOnDiscord}>
          <Text style={[s.supportText, { color: C.purple }]}>DISCORD</Text>
        </Pressable>
      </View>

      <Text style={s.kicker2}>HONEST BY DESIGN</Text>
      <Text style={s.body}>RugBuster does not take money from token creators: no badges, no paid verification. Scans are free; agents and anyone who wants to can pay $0.01 per scan over x402 on Solana. Tracking is free for 3 tokens; wallets holding SKR or a Seeker Genesis Token track without limit. Your scan history stays on this phone.</Text>

      <Text style={s.kicker2}>WHO BUILDS THIS</Text>
      <Text style={s.body}>Fedja Furduj, Belgrade. 25 years in design and multimedia. Got rugged as a crypto beginner by a token a scanner called safe, so built the check he wanted.</Text>

      <View style={{ marginTop: 18 }}>
        {LINKS.map(([label, url]) => (
          <Text key={url} style={s.link} onPress={() => open(url)}>{label.toUpperCase()} ↗</Text>
        ))}
      </View>
      <Text style={s.foot}>Read from chain. Not financial advice. v1.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 140 },
  kicker: { fontFamily: F.monoBold, color: C.green, fontSize: 11, letterSpacing: 3 },
  kicker2: { fontFamily: F.monoBold, color: C.green, fontSize: 11, letterSpacing: 3, marginTop: 30 },
  title: { fontFamily: F.display, color: C.text, fontSize: 22, lineHeight: 30, marginTop: 8, marginBottom: 8 },
  row: { flexDirection: "row", gap: 14, marginTop: 16 },
  n: { fontFamily: F.display, color: C.purple, fontSize: 22, width: 36 },
  rowHead: { fontFamily: F.bodyBold, color: C.text, fontSize: 18 },
  rowBody: { fontFamily: F.body, color: C.soft, fontSize: 16, lineHeight: 22, marginTop: 2 },
  body: { fontFamily: F.body, color: C.soft, fontSize: 17, lineHeight: 24, marginTop: 10 },
  supportRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  supportBtn: { borderWidth: 1.5, borderColor: C.green, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  supportText: { fontFamily: F.monoBold, color: C.green, fontSize: 11, letterSpacing: 1.5 },
  link: { fontFamily: F.monoBold, color: C.cyan, fontSize: 12, letterSpacing: 1.5, paddingVertical: 9 },
  foot: { fontFamily: F.body, color: C.muted, fontSize: 13, marginTop: 24 },
});
