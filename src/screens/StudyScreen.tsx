import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { C, F } from "../theme";

const open = (url: string) => Linking.openURL(url).catch(() => {});

export function StudyScreen({ onOpen }: { onOpen: (mint: string) => void }) {
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.kicker}>THE FINDING · 9,170 LAUNCHES</Text>
      <Text style={s.title}>The creator's own position gives it away.</Text>
      <Text style={s.body}>
        On pump.fun every token comes from the same template: mint and freeze are revoked for honest and dishonest tokens alike, so contract checks call both clean. What differs is what the creator does with their own tokens, and that buy sits in the transaction that creates the token.
      </Text>

      <View style={s.stat}>
        <Text style={[s.num, { color: C.green }]}>89%</Text>
        <Text style={s.statText}>of creators who bought 1%+ of their token sold all of it within the first hour. 97.6% within 30 days. (2,785 creators.)</Text>
      </View>
      <View style={s.stat}>
        <Text style={[s.num, { color: C.warn }]}>163/300</Text>
        <Text style={s.statText}>launches had three or more wallets buying within five seconds of creation. 670 of 1,226 early buyers were bot wallets.</Text>
      </View>

      <Text style={s.kicker2}>SAME TOKEN, SAME DAY</Text>
      <View style={s.vs}>
        <View style={s.vsCol}>
          <Text style={s.vsHead}>CONTRACT SCANNER</Text>
          <Text style={[s.vsNum, { color: C.muted }]}>0%</Text>
          <Text style={s.vsText}>creator holds</Text>
        </View>
        <View style={[s.vsCol, { borderColor: C.danger }]}>
          <Text style={[s.vsHead, { color: C.danger }]}>RUGBUSTER</Text>
          <Text style={[s.vsNum, { color: C.danger }]}>35.5%</Text>
          <Text style={s.vsText}>bought at creation, sold 22 s later</Text>
        </View>
      </View>
      <Text style={s.link} onPress={() => onOpen("CqNJeUKi2feUBCbG2rARBQxh9BwUynoK5WrH6d8Bpump")}>SCAN TOASTCAT YOURSELF →</Text>

      <Text style={s.kicker2}>OUR OWN MISS</Text>
      <Text style={s.body}>Our old rules called 1,346 of these 2,785 tokens safe. We fixed it on Sep 18 and published the miss with the data.</Text>

      <View style={s.links}>
        <Text style={s.link} onPress={() => open("https://medium.com/@ffurduj/we-checked-what-2-785-solana-token-creators-did-with-their-own-tokens-2d943b3820a4")}>READ THE STUDY ↗</Text>
        <Text style={s.link} onPress={() => open("https://gitlab.com/rugbuster/rugbuster-solana-outcomes")}>DATA AND CODE ↗</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 140 },
  kicker: { fontFamily: F.monoBold, color: C.green, fontSize: 11, letterSpacing: 3 },
  kicker2: { fontFamily: F.monoBold, color: C.green, fontSize: 11, letterSpacing: 3, marginTop: 30 },
  title: { fontFamily: F.display, color: C.text, fontSize: 22, lineHeight: 30, marginTop: 8 },
  body: { fontFamily: F.body, color: C.soft, fontSize: 17, lineHeight: 24, marginTop: 12 },
  stat: { backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 16 },
  num: { fontFamily: F.display, fontSize: 40 },
  statText: { fontFamily: F.body, color: C.soft, fontSize: 16, lineHeight: 22, marginTop: 6 },
  vs: { flexDirection: "row", gap: 10, marginTop: 12 },
  vsCol: { flex: 1, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel, borderRadius: 14, padding: 14 },
  vsHead: { fontFamily: F.monoBold, color: C.muted, fontSize: 10, letterSpacing: 1.5 },
  vsNum: { fontFamily: F.display, fontSize: 28, marginTop: 8 },
  vsText: { fontFamily: F.body, color: C.soft, fontSize: 14, marginTop: 4 },
  links: { gap: 14, marginTop: 24 },
  link: { fontFamily: F.monoBold, color: C.cyan, fontSize: 12, letterSpacing: 1.5, marginTop: 14 },
});
