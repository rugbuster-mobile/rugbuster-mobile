// Pay $0.01 USDC per scan over x402 on Solana, signed in the phone's wallet
// through Mobile Wallet Adapter. Same flow as the Creator Trace page:
// ask for the price (402), build one USDC transfer whose network fee the
// facilitator pays, have the wallet sign it, send it back with the request.
// The user is charged only when a verdict comes back.

import { Buffer } from "buffer";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { transact, Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { API } from "./api";

const TOKEN = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const ata = (owner: PublicKey, mint: PublicKey) =>
  PublicKey.findProgramAddressSync([owner.toBytes(), TOKEN.toBytes(), mint.toBytes()], ATA)[0];

const IDENTITY = { name: "RugBuster", uri: "https://rugbuster.io", icon: "favicon.png" };

const encodeJson = (obj: unknown) => Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
const decodeJson = (str: string) => JSON.parse(Buffer.from(str, "base64").toString("utf8"));

function buildPayment(req: any, payer: PublicKey): VersionedTransaction {
  const extra = req.extra || {};
  if (!extra.feePayer || !extra.recentBlockhash) throw new Error("The payment challenge has no fee payer or blockhash.");
  const mint = new PublicKey(req.asset);
  const payTo = new PublicKey(req.payTo);
  const data = new Uint8Array(10);
  data[0] = 12; // TransferChecked
  new DataView(data.buffer).setBigUint64(1, BigInt(req.amount), true);
  data[9] = 6; // USDC decimals
  const transfer = new TransactionInstruction({
    programId: TOKEN,
    keys: [
      { pubkey: ata(payer, mint), isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: ata(payTo, mint), isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: false },
    ],
    data: Buffer.from(data),
  });
  // No memo: wallets may append their own guard instructions when they sign,
  // and the facilitator accepts at most seven instructions, three of them ours.
  const message = new TransactionMessage({
    payerKey: new PublicKey(extra.feePayer),
    recentBlockhash: extra.recentBlockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 20000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
      transfer,
    ],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

function facilitatorReason(text: string) {
  const m = /\{.*\}/s.exec(text || "");
  try {
    const j = JSON.parse(m ? m[0] : text);
    return j.invalidMessage || j.invalidReason || text;
  } catch {
    return text;
  }
}

export type PaidResult = { data: any; receiptTx: string | null; charged: boolean };

export async function payAndScan(mint: string, onStep: (s: string) => void): Promise<PaidResult> {
  const url = `${API}/x402/score?address=${mint}`;
  onStep("Asking for the price…");
  const first = await fetch(url);
  if (first.status !== 402) throw new Error(`Expected a 402 price quote, got ${first.status}.`);
  const challenge = decodeJson(first.headers.get("PAYMENT-REQUIRED") || "");
  const req = (challenge.accepts || []).find((a: any) => String(a.network).startsWith("solana:"));
  if (!req) throw new Error("No Solana payment option offered.");

  onStep("Waiting for your wallet…");
  let signed: VersionedTransaction;
  try {
    signed = await transact(async (wallet: Web3MobileWallet) => {
      const auth = await wallet.authorize({ chain: "solana:mainnet", identity: IDENTITY });
      const payer = new PublicKey(Buffer.from(auth.accounts[0].address, "base64"));
      const tx = buildPayment(req, payer);
      const [out] = await wallet.signTransactions({ transactions: [tx] });
      return out;
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/no installed wallet|ERROR_WALLET_NOT_FOUND|not found/i.test(msg)) {
      throw new Error("No Solana wallet app found. Install Phantom or Solflare, then try again.");
    }
    throw new Error("Signature cancelled in the wallet. Nothing was paid.");
  }

  onStep("Settling on Solana…");
  const header = encodeJson({
    x402Version: challenge.x402Version || 2,
    payload: { transaction: Buffer.from(signed.serialize()).toString("base64") },
    accepted: req,
    resource: challenge.resource,
  });
  const paid = await fetch(url, { headers: { "PAYMENT-SIGNATURE": header } });
  const receiptHeader = paid.headers.get("PAYMENT-RESPONSE");
  const receipt = receiptHeader ? decodeJson(receiptHeader) : null;
  if (paid.status === 402) {
    let why = "payment rejected";
    const again = paid.headers.get("PAYMENT-REQUIRED");
    if (again) why = facilitatorReason(decodeJson(again).error || why);
    else {
      try {
        why = facilitatorReason((await paid.json()).error || why);
      } catch {}
    }
    throw new Error(`Payment not accepted, nothing was charged. Reason: ${why}`);
  }
  const data = await paid.json();
  const charged = !(paid.status === 503 && data?.x402?.charged === false);
  return { data, receiptTx: receipt?.transaction || null, charged };
}
