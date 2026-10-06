// Pro, unlocked by the Seeker economy: a wallet that holds SKR or a Seeker
// Genesis Token tracks as many tokens as it likes. Everyone else tracks three.
//
// The wallet is connected once through Mobile Wallet Adapter; the API then
// reads its public balances (/perks). Nothing is signed for this and nothing
// of value rides on the answer, so a wrong read costs at most a perk.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { transact, Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
import { API } from "./api";
import { netFetch } from "./net";

export const FREE_TRACK_LIMIT = 3;
const KEY = "rugbuster.perks.v1";
export const IDENTITY = { name: "RugBuster", uri: "https://rugbuster.io", icon: "favicon.png" };

export type Perks = {
  wallet: string | null;
  pro: boolean;
  reason: string | null; // "Seeker Genesis Token" or "12.5 SKR"
  skr: number;
  seekerGenesisToken: boolean;
  checkedAt: number;
};

export const NO_PERKS: Perks = { wallet: null, pro: false, reason: null, skr: 0, seekerGenesisToken: false, checkedAt: 0 };

export async function loadPerks(): Promise<Perks> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...NO_PERKS, ...JSON.parse(raw) } : NO_PERKS;
  } catch {
    return NO_PERKS;
  }
}

async function save(p: Perks) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

// Ask the wallet app which account to use. The user approves in Phantom/Solflare.
export async function connectWallet(): Promise<string> {
  try {
    return await transact(async (wallet: Web3MobileWallet) => {
      const auth = await wallet.authorize({ chain: "solana:mainnet", identity: IDENTITY });
      return new PublicKey(Buffer.from(auth.accounts[0].address, "base64")).toBase58();
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/no installed wallet|ERROR_WALLET_NOT_FOUND|not found/i.test(msg)) {
      throw new Error("No Solana wallet app found. Install Phantom or Solflare, then try again.");
    }
    throw new Error("Wallet connection cancelled.");
  }
}

export async function refreshPerks(wallet: string): Promise<Perks> {
  const res = await netFetch(`${API}/perks?wallet=${encodeURIComponent(wallet)}`);
  const d = await res.json();
  if (!res.ok || !d?.checked) throw new Error("Could not read this wallet right now. Try again in a minute.");
  const p: Perks = {
    wallet,
    pro: !!d.pro,
    reason: d.reason || null,
    skr: Number(d.skr) || 0,
    seekerGenesisToken: !!d.seeker_genesis_token,
    checkedAt: Date.now(),
  };
  await save(p);
  return p;
}

export async function connectAndRefresh(): Promise<Perks> {
  return refreshPerks(await connectWallet());
}

export async function forgetWallet(): Promise<Perks> {
  await save(NO_PERKS);
  return NO_PERKS;
}
