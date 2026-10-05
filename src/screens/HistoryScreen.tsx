import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Entry } from "../history";
import { short } from "../mint";
import { ago, C, F, verdictOf } from "../theme";

export function HistoryScreen({ history, onOpen }: { history: Entry[]; onOpen: (mint: string) => void }) {
  return (
    <View style={s.root}>
      <Text style={s.kicker}>ON THIS PHONE ONLY</Text>
      <Text style={s.title}>Your scans</Text>
      <FlatList
        data={history}
        keyExtractor={(h) => h.mint}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 12 }}
        ListEmptyComponent={<Text style={s.empty}>No scans yet. Tap the scan button below.</Text>}
        renderItem={({ item }) => {
          const v = verdictOf(item.label);
          return (
            <Pressable style={({ pressed }) => [s.row, pressed && { backgroundColor: C.panel2 }]} onPress={() => onOpen(item.mint)}>
              <View style={[s.ring, { borderColor: v.color }]}>
                <Text style={[s.ringNum, { color: v.color }]}>{item.score ?? "–"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sym} numberOfLines={1}>{item.name || short(item.mint)}</Text>
                <Text style={s.meta}>{short(item.mint)} · {ago(item.at)}</Text>
              </View>
              <Text style={[s.label, { color: v.color }]}>{v.label}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18, paddingTop: 56 },
  kicker: { fontFamily: F.monoBold, color: C.green, fontSize: 11, letterSpacing: 3 },
  title: { fontFamily: F.display, color: C.text, fontSize: 22, marginTop: 6 },
  empty: { fontFamily: F.body, color: C.muted, textAlign: "center", marginTop: 40, fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, borderRadius: 8 },
  ring: { width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  ringNum: { fontFamily: F.displayBold, fontSize: 13 },
  sym: { fontFamily: F.bodyBold, color: C.text, fontSize: 18 },
  meta: { fontFamily: F.mono, color: C.muted, fontSize: 11, marginTop: 2 },
  label: { fontFamily: F.monoBold, fontSize: 10, letterSpacing: 1.5 },
});
