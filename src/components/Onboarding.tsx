import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../theme";

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: "eye-outline",
    title: "Read the creator,\nnot the contract.",
    body: "On pump.fun, honest and dishonest tokens pass the same contract checks. RugBuster reads what the creator did with their own tokens: 89% of creators who bought 1%+ sold it all within the first hour.",
  },
  {
    icon: "share-social-outline",
    title: "Share → RugBuster",
    body: "In Phantom, DexScreener or Solscan, tap Share and pick RugBuster. The verdict comes with the transactions behind it, and a list of what could not be checked.",
  },
  {
    icon: "notifications-outline",
    title: "Track a token,\nget the alert.",
    body: "Tap TRACK and RugBuster re-checks the token in the background. When the creator sells, or the verdict gets worse, your phone tells you.",
  },
];

export function Onboarding({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onDone}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.iconRing}>
            <Ionicons name={step.icon} size={34} color={C.green} />
          </View>
          <Text style={s.title}>{step.title}</Text>
          <Text style={s.body}>{step.body}</Text>
          <View style={s.dots}>
            {STEPS.map((_, k) => (
              <View key={k} style={[s.dot, k === i && s.dotOn]} />
            ))}
          </View>
          <View style={s.row}>
            <Pressable onPress={onDone} hitSlop={8}>
              <Text style={s.skip}>{last ? "" : "SKIP"}</Text>
            </Pressable>
            <Pressable style={s.btn} onPress={() => (last ? onDone() : setI(i + 1))}>
              <Text style={s.btnText}>{last ? "START SCANNING" : "NEXT"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(6,5,12,0.92)", justifyContent: "center", padding: 22 },
  card: { backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 22, padding: 26 },
  iconRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: C.green, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontFamily: F.display, color: C.text, fontSize: 22, lineHeight: 30 },
  body: { fontFamily: F.body, color: C.soft, fontSize: 17, lineHeight: 24, marginTop: 12 },
  dots: { flexDirection: "row", gap: 8, marginTop: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line },
  dotOn: { backgroundColor: C.green, width: 22 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22 },
  skip: { fontFamily: F.monoBold, color: C.muted, fontSize: 12, letterSpacing: 2, paddingVertical: 10 },
  btn: { backgroundColor: C.green, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  btnText: { fontFamily: F.display, color: C.bg, fontSize: 12, letterSpacing: 2 },
});
