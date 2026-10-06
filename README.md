# RugBuster for Android

**Spot the creator dump before you buy.** A Solana token check for your phone, built for the Solana Mobile CLOCK IN hackathon.

On pump.fun-style launches, honest and dishonest tokens pass the same contract checks: the template revokes mint and freeze for everyone. RugBuster reads what the creator did with their own tokens instead. The creator's buy sits in the transaction that creates the token, so it is visible before anyone else can buy. In a study of 9,170 launches, 89% of creators who bought 1%+ of their token sold all of it within the first hour.

## What the app does

- **Scan** any Solana mint or link: verdict (DANGER / WARNING / NO FINDINGS), the reason, and every finding linked to its transaction on Solscan: the creator's buy and sell, the bots in the first five seconds, who funded the creator, the contract's powers and the holders. It also lists what it could not check; a gap is never shown as clean.
- **Share → RugBuster** from Phantom, DexScreener, Solscan or any browser: the app opens and scans the token you shared.
- **Track**: follow a token and get a notification when its creator sells or its verdict gets worse. Re-checked in the background.
- **Live**: what RugBuster has been seeing in the last 48 hours.
- **Pay $0.01 USDC per scan from your wallet** over x402 on Solana, signed through **Mobile Wallet Adapter**. The network fee is paid by the facilitator; you are charged only when a verdict comes back.
- The token's own logo rebuilt from particles, the same scene as rugbuster.io.

Everything a scan says comes from the public RugBuster API, which reads the chain live (Helius RPC), plus our own records of earlier launches. No AI writes the verdict.

## Download

Install the APK from the [latest release](https://github.com/rugbuster-mobile/rugbuster-mobile/releases/latest) ([direct download](https://github.com/rugbuster-mobile/rugbuster-mobile/releases/latest/download/RugBuster.apk)) on any Android phone (allow installs from your browser or file manager when asked).

## Build it yourself

Requirements: Node.js 20+, JDK 17, Android SDK (platform 35, build-tools 35).

```bash
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The APK is in `android/app/build/outputs/apk/release/app-release.apk`. Without RugBuster's release key on your machine, the build signs with the debug key, which installs and runs the same; only the official release is signed with the key published in `https://rugbuster.io/.well-known/assetlinks.json`, which is how wallets verify the app over Mobile Wallet Adapter.

For development: `npx expo run:android` with a phone connected over USB.

## How it is put together

| Path | What it does |
|---|---|
| `App.tsx` | Tabs, share intent, scan / pay / track flow |
| `src/pay.ts` | x402 payment: 402 price quote → USDC transfer built for the facilitator → signed in the wallet via Mobile Wallet Adapter |
| `src/watch.ts` | Tracked tokens, background re-check (expo-background-task) and notifications |
| `src/facts.ts` | Turns the API answer into findings with Solscan proof links |
| `src/sphere.ts` | The particle sphere (Three.js in a WebView) |
| `src/net.ts` | Network calls that survive the round trip to the wallet app |
| `src/mint.ts` | Pulls a mint out of a pasted address or a Solscan / pump.fun / DexScreener link |

API used: `https://rugbuster-solana-api-production.up.railway.app` (`/score`, `/x402/score`, `/feed`, `/token-image`).

## Links

- Web: https://rugbuster.io · Creator Trace: https://rugbuster-solana-api-production.up.railway.app/shield
- Study, data and API source: https://gitlab.com/rugbuster
- X: https://x.com/RugBusterAI

Built by Fedja Furduj (Belgrade). Read from chain. Not financial advice.

## Pitch deck

[RugBuster-CLOCK-IN-deck.pdf](docs/RugBuster-CLOCK-IN-deck.pdf)
