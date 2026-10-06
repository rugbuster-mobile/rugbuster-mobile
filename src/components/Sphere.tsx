import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { SPHERE_HTML } from "../sphere";

export type SphereHandle = { scan: (on: boolean) => void; verdict: (color: string | null) => void; image: (url: string | null) => void };

export const Sphere = forwardRef<SphereHandle, { height: number }>(({ height }, ref) => {
  const web = useRef<WebView>(null);
  const run = (js: string) => web.current?.injectJavaScript(`try{${js}}catch(e){};true;`);
  useImperativeHandle(ref, () => ({
    scan: (on) => run(`window.rb&&rb.scan(${on ? "true" : "false"})`),
    verdict: (color) => run(`window.rb&&rb.verdict(${color ? JSON.stringify(color) : "null"})`),
    image: (url) => run(`window.rb&&rb.image(${url ? JSON.stringify(url) : "null"})`),
  }));
  return (
    <View style={[s.wrap, { height }]} pointerEvents="none">
      <WebView
        ref={web}
        source={{ html: SPHERE_HTML, baseUrl: "https://rugbuster.io" }}
        style={s.web}
        originWhitelist={["*"]}
        javaScriptEnabled
        scrollEnabled={false}
        androidLayerType="hardware"
        overScrollMode="never"
        setSupportMultipleWindows={false}
      />
    </View>
  );
});

const s = StyleSheet.create({
  wrap: { width: "100%", overflow: "hidden" },
  web: { flex: 1, backgroundColor: "transparent" },
});
