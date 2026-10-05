import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useFonts } from "expo-font";
import { Orbitron_700Bold, Orbitron_900Black } from "@expo-google-fonts/orbitron";
import { Rajdhani_500Medium, Rajdhani_700Bold } from "@expo-google-fonts/rajdhani";
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { Ionicons } from "@expo/vector-icons";
import { useShareIntent } from "expo-share-intent";
import * as Notifications from "expo-notifications";
import { freeScan, tokenImage } from "./src/api";
import { SphereHandle } from "./src/components/Sphere";
import { Entry, loadHistory, remember } from "./src/history";
import { resolveMint } from "./src/mint";
import { payAndScan } from "./src/pay";
import { AboutScreen } from "./src/screens/AboutScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { LiveScreen } from "./src/screens/LiveScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { StudyScreen } from "./src/screens/StudyScreen";
import { C, F, verdictOf } from "./src/theme";
import { checkWatchlist, clearAlert, loadWatchlist, toggleWatch, Watched } from "./src/watch";

type Tab = "live" | "history" | "scan" | "study" | "about";
const SIDE_TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "live", label: "Live", icon: "pulse" },
  { key: "history", label: "Watch", icon: "notifications-outline" },
  { key: "study", label: "Study", icon: "stats-chart" },
  { key: "about", label: "About", icon: "shield-checkmark-outline" },
];

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold, Orbitron_900Black, Rajdhani_500Medium, Rajdhani_700Bold,
    JetBrainsMono_400Regular, JetBrainsMono_700Bold,
  });
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const sphere = useRef<SphereHandle | null>(null);
  const [tab, setTab] = useState<Tab>("scan");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);

  const [watchlist, setWatchlist] = useState<Watched[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadHistory().then(setHistory);
    loadWatchlist().then(setWatchlist);
  }, []);

  // Re-check the watchlist whenever the app comes to the front. Changes show
  // up in the app; the background task is what sends notifications.
  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      setWatchlist(await checkWatchlist(false));
    } finally {
      setChecking(false);
    }
  }, []);
  useEffect(() => {
    recheck();
    const sub = AppState.addEventListener("change", (st) => st === "active" && recheck());
    return () => sub.remove();
  }, [recheck]);

  // Android back goes to the scan tab before it leaves the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tab !== "scan") {
        setTab("scan");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tab]);

  const showVerdict = useCallback((data: any) => {
    const v = verdictOf(data.label);
    sphere.current?.scan(false);
    sphere.current?.verdict(v.color);
    sphere.current?.image(tokenImage(data.address));
    Haptics.notificationAsync(
      data.label === "DANGER" ? Haptics.NotificationFeedbackType.Error
        : data.label === "WARN" ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
  }, []);

  const scan = useCallback(async (text: string) => {
    setTab("scan");
    setError(null);
    setReceipt(null);
    setResult(null);
    setBusy("Finding the token…");
    sphere.current?.scan(true);
    try {
      const mint = await resolveMint(text);
      if (!mint) throw new Error("No Solana token address in that. Paste the mint, or a Solscan, pump.fun or DexScreener link.");
      setInput(mint);
      setBusy("Reading the chain…");
      const data = await freeScan(mint);
      setResult(data);
      showVerdict(data);
      setHistory(await remember(data));
    } catch (e: any) {
      sphere.current?.scan(false);
      sphere.current?.verdict(null);
      setError(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }, [showVerdict]);

  // "Share → RugBuster" from Phantom, DexScreener, Solscan or any browser.
  useEffect(() => {
    if (!hasShareIntent) return;
    const text = shareIntent?.text || shareIntent?.webUrl || "";
    resetShareIntent();
    if (text) scan(text);
  }, [hasShareIntent, shareIntent, resetShareIntent, scan]);

  // Tapping a watchlist notification opens that token.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const mint = (r.notification.request.content.data as any)?.mint;
      if (mint) scan(String(mint));
    });
    return () => sub.remove();
  }, [scan]);

  const watch = async () => {
    if (!result?.address) return;
    Haptics.selectionAsync().catch(() => {});
    setWatchlist(await toggleWatch(result));
  };

  const openFromWatch = async (mint: string) => {
    await clearAlert(mint);
    setWatchlist(await loadWatchlist());
    scan(mint);
  };

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
    sphere.current?.scan(true);
    try {
      const out = await payAndScan(result.address, setBusy);
      setResult(out.data);
      showVerdict(out.data);
      setReceipt(out.charged ? out.receiptTx : null);
      if (!out.charged) setError("No verdict for this token, so you were not charged.");
    } catch (e: any) {
      sphere.current?.scan(false);
      setError(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  };

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <View style={s.glowA} />
      <View style={s.glowB} />
      {/* The scan screen stays mounted so the sphere keeps its state between tabs. */}
      <View style={[s.page, tab !== "scan" && s.hidden]}>
        <ScanScreen
          sphere={sphere}
          input={input}
          setInput={setInput}
          busy={busy}
          error={error}
          result={result}
          receipt={receipt}
          onScan={scan}
          onPaste={paste}
          onPay={pay}
          watched={!!result && watchlist.some((w) => w.mint === result.address)}
          onWatch={watch}
          alerts={watchlist.filter((w) => !!w.alert).length}
          onAlerts={() => setTab("history")}
        />
      </View>
      {tab === "live" && <View style={s.page}><LiveScreen onOpen={scan} active={tab === "live"} /></View>}
      {tab === "history" && <View style={s.page}><HistoryScreen history={history} watchlist={watchlist} checking={checking} onRefresh={recheck} onOpen={openFromWatch} /></View>}
      {tab === "study" && <View style={s.page}><StudyScreen onOpen={scan} /></View>}
      {tab === "about" && <View style={s.page}><AboutScreen /></View>}

      <View style={s.bar}>
        {SIDE_TABS.slice(0, 2).map((t) => <TabButton key={t.key} t={t} active={tab === t.key} dot={t.key === "history" && watchlist.some((w) => !!w.alert)} onPress={() => setTab(t.key)} />)}
        <View style={s.centerSlot}>
          <Pressable
            style={({ pressed }) => [s.center, tab === "scan" && s.centerOn, pressed && { transform: [{ scale: 0.94 }] }]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              if (tab === "scan") paste();
              else setTab("scan");
            }}
          >
            <Ionicons name="scan" size={30} color={tab === "scan" ? C.bg : C.green} />
          </Pressable>
          <Text style={[s.tabLabel, tab === "scan" && { color: C.green }]}>{tab === "scan" ? "Paste & scan" : "Scan"}</Text>
        </View>
        {SIDE_TABS.slice(2).map((t) => <TabButton key={t.key} t={t} active={tab === t.key} onPress={() => setTab(t.key)} />)}
      </View>
    </View>
  );
}

function TabButton({ t, active, onPress, dot }: { t: (typeof SIDE_TABS)[number]; active: boolean; onPress: () => void; dot?: boolean }) {
  return (
    <Pressable style={s.tab} onPress={onPress} hitSlop={6}>
      <View>
        <Ionicons name={t.icon} size={22} color={active ? C.green : C.muted} />
        {dot && <View style={s.dot} />}
      </View>
      <Text style={[s.tabLabel, active && { color: C.green }]}>{t.label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  glowA: { position: "absolute", top: -120, left: -120, width: 320, height: 320, borderRadius: 160, backgroundColor: "#9945ff", opacity: 0.12 },
  glowB: { position: "absolute", top: 120, right: -140, width: 300, height: 300, borderRadius: 150, backgroundColor: "#14f195", opacity: 0.06 },
  page: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  hidden: { opacity: 0, zIndex: -1, pointerEvents: "none" },
  bar: {
    position: "absolute", left: 12, right: 12, bottom: 18, height: 74, borderRadius: 26,
    backgroundColor: "rgba(13,11,23,0.96)", borderWidth: 1, borderColor: C.line,
    flexDirection: "row", alignItems: "flex-end", paddingBottom: 10,
  },
  tab: { flex: 1, alignItems: "center", gap: 4 },
  dot: { position: "absolute", top: -2, right: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: C.danger },
  tabLabel: { fontFamily: F.bodyBold, color: C.muted, fontSize: 12 },
  centerSlot: { flex: 1.2, alignItems: "center", gap: 4 },
  center: {
    width: 66, height: 66, borderRadius: 33, marginTop: -40, alignItems: "center", justifyContent: "center",
    backgroundColor: C.panel, borderWidth: 2, borderColor: C.green,
    shadowColor: C.green, shadowOpacity: 0.6, shadowRadius: 16, elevation: 12,
  },
  centerOn: { backgroundColor: C.green },
});
