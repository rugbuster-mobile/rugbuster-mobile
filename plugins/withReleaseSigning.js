// Signs release builds with RugBuster's own key, read from a properties file
// outside the repo (RB_KEYSTORE_PROPERTIES, default C:/rb/keys/keystore.properties).
// Wallets verify the app through rugbuster.io/.well-known/assetlinks.json,
// which names this key's fingerprint, so every release must use the same key.
const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes("rbRelease")) return cfg;
    src = src.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        rbRelease {
            def propsFile = file(System.getenv("RB_KEYSTORE_PROPERTIES") ?: "C:/rb/keys/keystore.properties")
            if (propsFile.exists()) {
                def p = new Properties()
                propsFile.withInputStream { p.load(it) }
                storeFile file(p.storeFile)
                storePassword p.storePassword
                keyAlias p.keyAlias
                keyPassword p.keyPassword
            } else {
                // No release key on this machine (a fresh clone): sign with the
                // debug key so the build still produces an installable APK.
                storeFile file("debug.keystore")
                storePassword "android"
                keyAlias "androiddebugkey"
                keyPassword "android"
            }
        }`
    );
    // the release build type: use our key instead of the debug one
    src = src.replace(/(release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/, "$1signingConfig signingConfigs.rbRelease");
    cfg.modResults.contents = src;
    return cfg;
  });
};
