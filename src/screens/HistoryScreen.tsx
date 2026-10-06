import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Entry } from "../history";
import { short } from "../mint";
import { ago, C, F, verdictOf } from "../theme";
import { testAlert, Watched } from "../watch";
import { FREE_TRACK_LIMIT, Perks } from "../perks";

type Props = {
  history: Entry[];
  watchlist: Watched[];
  checking: boolean;
  onRefresh: () => void;
  onOpen: (mint: string) => void;
  perks: Perks;
  perksBusy: boolean;
  perksNote: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function HistoryScreen({ history, watchlist, checking, onRefresh, onOpen, perks, perksBusy, perksNote, onConnect, onDisconnect }: Props) {
  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={checking} onRefresh={onRefresh} tintColor={C.green} colors={[C.green]} />}
    >
      <Text style={s.kicker}>TRACKED · ALERTS</Text>
      <Text style={s.title}>Tokens you follow</Text>
      <Text style={s.sub}>
        RugBuster re-checks these in the background and notifies you when a creator sells or a verdict gets worse. To add one, scan it and tap TRACK next to the scan button.
      </Text>

      <Text style={s.test} onPress={() => testAlert()}>SEND A TEST ALERT (ARRIVES IN 5 S) →</Text>

      <View style={[s.pro, perks.pro && s.proOn]}>
        <View style={s.proTop}>
          <Text style={[s.proHead, perks.pro && { color: C.bg }]}>{perks.pro ? "★ PRO · UNLIMITED TRACKING" : `FREE · ${watchlist.length}/${FREE_TRACK_LIMIT} TRACKED`}</Text>
          {perks.pro && <Text style={[s.proBy, { color: C.bg }]}>by {perks.reason}</Text>}
        </View>
        <Text style={[s.proBody, perks.pro && { color: "#06301c" }]}>
          {perks.pro
            ? `Wallet ${short(perks.wallet)} holds ${perks.seekerGenesisToken ? "a Seeker Genesis Token" : "SKR"}. Track as many tokens as you like.`
            : "Holders of SKR or a Seeker Genesis Token track unlimited tokens. Connect your wallet to check; nothing is signed and nothing is charged."}
        </Text>
        {perksNote && !perks.pro && <Text style={s.proNote}>{perksNote}</Text>}
        <View style={s.proRow}>
          {perks.pro ? (
            <Pressable onPress={onDisconnect} hitSlop={8}><Text style={[s.proLink, { color: "#06301c" }]}>DISCONNECT</Text></Pressable>
          ) : (
            <Pressable style={[s.proBtn, perksBusy && { opacity: 0.6 }]} onPress={onConnect} disabled={perksBusy}>
              <Ionicons name="wallet-outline" size={16} color={C.bg} />
              <Text style={s.proBtnText}>{perksBusy ? "CHECKING…" : perks.wallet ? "RE-CHECK WALLET" : "CONNECT WALLET"}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {watchlist.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="notifications-outline" size={26} color={C.muted} />
          <Text style={s.empty}>Nothing tracked yet.</Text>
        </View>
      ) : (
        watchlist.map((w) => {
          const v = verdictOf(w.label);
          return (
            <Pressable key={w.mint} style={({ pressed }) => [s.wRow, !!w.alert && s.wAlert, pressed && { opacity: 0.8 }]} onPress={() => onOpen(w.mint)}>
              <View style={s.wTop}>
                <Text style={s.sym} numberOfLines={1}>{w.symbol}</Text>
                <Text style={[s.badge, { color: v.color, borderColor: v.color }]}>{v.label}{w.score != null ? ` ${w.score}` : ""}</Text>
              </View>
              {w.alert ? (
                <View style={s.alertLine}>
                  <Ionicons name="warning" size={14} color={C.danger} />
                  <Text style={s.alertText}>{w.alert}</Text>
                </View>
              ) : (
                <Text style={s.meta}>
                  {w.creator === "holding" ? "Creator still holds · watching for a sale" : w.creator === "sold" ? "Creator already sold" : "Watching the verdict"}
                </Text>
              )}
              <Text style={s.meta}>{short(w.mint)} · checked {ago(w.checkedAt)}</Text>
            </Pressable>
          );
        })
      )}

      <Text style={[s.kicker, { marginTop: 30 }]}>RECENT SCANS · ON THIS PHONE</Text>
      {history.length === 0 && <Text style={s.empty}>No scans yet.</Text>}
      {history.map((item) => {
        const v = verdictOf(item.label);
        return (
          <Pressable key={item.mint} style={({ pressed }) => [s.row, pressed && { backgroundColor: C.panel2 }]} onPress={() => onOpen(item.mint)}>
            <View style={[s.ring, { borderColor: v.color }]}>
              <Text style={[s.ringNum, { color: v.color }]}>{item.score ?? "–"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.hSym} numberOfLines={1}>{item.name || short(item.mint)}</Text>
              <Text style={s.meta}>{short(item.mint)} · {ago(item.at)}</Text>
            </View>
            <Text style={[s.label, { color: v.color }]}>{v.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 140 },
  kicker: { fontFamily: F.monoBold, color: C.green, fontSize: 11, letterSpacing: 3 },
  title: { fontFamily: F.display, color: C.text, fontSize: 22, marginTop: 6 },
  sub: { fontFamily: F.body, color: C.muted, fontSize: 15, lineHeight: 20, marginTop: 6, marginBottom: 12 },
  test: { fontFamily: F.monoBold, color: C.cyan, fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  pro: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.purple, borderRadius: 14, padding: 14, marginBottom: 14 },
  proOn: { backgroundColor: C.green, borderColor: C.green },
  proTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  proHead: { fontFamily: F.monoBold, color: C.purple, fontSize: 11, letterSpacing: 2 },
  proBy: { fontFamily: F.bodyBold, fontSize: 13 },
  proBody: { fontFamily: F.body, color: C.soft, fontSize: 15, lineHeight: 20, marginTop: 6 },
  proNote: { fontFamily: F.bodyBold, color: C.warn, fontSize: 14, marginTop: 8 },
  proRow: { flexDirection: "row", marginTop: 12 },
  proBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.purple, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  proBtnText: { fontFamily: F.monoBold, color: C.bg, fontSize: 11, letterSpacing: 1.5 },
  proLink: { fontFamily: F.monoBold, fontSize: 11, letterSpacing: 1.5, paddingVertical: 6 },
  emptyBox: { alignItems: "center", gap: 8, paddingVertical: 24, borderWidth: 1, borderColor: C.line, borderStyle: "dashed", borderRadius: 14 },
  empty: { fontFamily: F.body, color: C.muted, textAlign: "center", fontSize: 16, marginTop: 8 },
  wRow: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, marginTop: 10 },
  wAlert: { borderColor: C.danger, backgroundColor: "#1c0a12" },
  wTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  sym: { flex: 1, fontFamily: F.bodyBold, color: C.text, fontSize: 19 },
  badge: { fontFamily: F.monoBold, fontSize: 10, letterSpacing: 1.5, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  alertLine: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginTop: 6 },
  alertText: { flex: 1, fontFamily: F.bodyBold, color: C.danger, fontSize: 15 },
  meta: { fontFamily: F.mono, color: C.muted, fontSize: 11, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, borderRadius: 8 },
  ring: { width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  ringNum: { fontFamily: F.displayBold, fontSize: 13 },
  hSym: { fontFamily: F.bodyBold, color: C.text, fontSize: 18 },
  label: { fontFamily: F.monoBold, fontSize: 10, letterSpacing: 1.5 },
});
