import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { FeedItem, loadFeed } from "../api";
import { short } from "../mint";
import { ago, C, F, verdictOf } from "../theme";

const FILTERS = ["ALL", "DANGER", "WARN"] as const;

export function LiveScreen({ onOpen, active }: { onOpen: (mint: string) => void; active: boolean }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("DANGER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await loadFeed());
      setError(null);
    } catch {
      setError("Could not reach the RugBuster API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [active, refresh]);

  const shown = filter === "ALL" ? items : items.filter((i) => i.label === filter);

  return (
    <View style={s.root}>
      <Text style={s.kicker}>LIVE · LAST 48 H</Text>
      <Text style={s.title}>What RugBuster is seeing</Text>
      <Text style={s.sub}>Tokens scanned on rugbuster.io, the API and this app. Refreshes every 30 seconds.</Text>
      <View style={s.filters}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[s.filter, filter === f && s.filterOn]}>
            <Text style={[s.filterText, filter === f && { color: C.bg }]}>{f}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <FlatList
        data={shown}
        keyExtractor={(i) => i.address}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.green} colors={[C.green]} />}
        ListEmptyComponent={!loading ? <Text style={s.empty}>Nothing here yet.</Text> : null}
        renderItem={({ item }) => {
          const v = verdictOf(item.label);
          return (
            <Pressable style={({ pressed }) => [s.row, pressed && { backgroundColor: C.panel2 }]} onPress={() => onOpen(item.address)}>
              <View style={[s.bar, { backgroundColor: v.color }]} />
              <View style={{ flex: 1 }}>
                <View style={s.rowTop}>
                  <Text style={s.sym} numberOfLines={1}>{item.symbol || item.name || short(item.address)}</Text>
                  <Text style={[s.badge, { color: v.color, borderColor: v.color }]}>{v.label}</Text>
                </View>
                <Text style={s.reason} numberOfLines={2}>{item.reason || item.name || short(item.address)}</Text>
                <Text style={s.meta}>{short(item.address)} · {ago(item.scanned_at)}</Text>
              </View>
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
  sub: { fontFamily: F.body, color: C.muted, fontSize: 15, marginTop: 6 },
  filters: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 10 },
  filter: { borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  filterOn: { backgroundColor: C.green, borderColor: C.green },
  filterText: { fontFamily: F.monoBold, color: C.soft, fontSize: 11, letterSpacing: 1.5 },
  error: { fontFamily: F.body, color: C.danger, marginVertical: 8 },
  empty: { fontFamily: F.body, color: C.muted, textAlign: "center", marginTop: 40, fontSize: 16 },
  row: { flexDirection: "row", gap: 12, paddingVertical: 12, paddingRight: 6, borderBottomWidth: 1, borderBottomColor: C.line, borderRadius: 8 },
  bar: { width: 3, borderRadius: 2 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  sym: { flex: 1, fontFamily: F.bodyBold, color: C.text, fontSize: 18 },
  badge: { fontFamily: F.monoBold, fontSize: 10, letterSpacing: 1.5, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  reason: { fontFamily: F.body, color: C.soft, fontSize: 15, marginTop: 2 },
  meta: { fontFamily: F.mono, color: C.muted, fontSize: 11, marginTop: 4 },
});
