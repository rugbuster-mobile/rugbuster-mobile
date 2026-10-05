// Turns whatever the user shared, pasted or copied into one Solana mint address.
// Same rules as the Chrome extension, so both read a link the same way.

// Solana addresses are base58: no 0, O, I or l, 32 to 44 characters.
const BASE58_RUN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

// Program and system addresses that sit next to every token on an explorer page.
// They are never the token itself.
const NOT_TOKENS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token program
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022 program
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // associated token accounts
  "metaqbxxUerdq28cj1RJ2kxTW3vf2bX2rNYfE6c2DAwL", // Metaplex metadata
  "11111111111111111111111111111111", // system program
  "So11111111111111111111111111111111111111112", // wrapped SOL
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // pump.fun program
]);

export function extractMint(text: string | null | undefined): string | null {
  if (!text) return null;
  const candidates = (String(text).match(BASE58_RUN) || []).filter((c) => !NOT_TOKENS.has(c));
  if (!candidates.length) return null;
  // Prefer the pump.fun style mint when there is one, else the longest run.
  const pump = candidates.find((c) => c.endsWith("pump"));
  if (pump) return pump;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

// DexScreener links carry the pool (pair) address, lowercased, not the token.
// Its public API says which token the pair trades; SOL and stablecoins on the
// other side of the pair are never the token being asked about.
const DEXSCREENER_PAIR = /dexscreener\.com\/solana\/([1-9a-z]{32,44})/i;
const QUOTE_SIDE = new Set([
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
]);

export async function resolveMint(text: string | null | undefined): Promise<string | null> {
  const pair = String(text || "").match(DEXSCREENER_PAIR);
  if (!pair) return extractMint(text);
  try {
    const response = await fetch("https://api.dexscreener.com/latest/dex/pairs/solana/" + pair[1]);
    const data = await response.json();
    const found = (data.pairs && data.pairs[0]) || data.pair;
    if (!found) return null;
    const base = found.baseToken?.address;
    const quote = found.quoteToken?.address;
    if (base && !QUOTE_SIDE.has(base)) return base;
    if (quote && !QUOTE_SIDE.has(quote)) return quote;
    return base || null;
  } catch {
    return null;
  }
}

export const short = (s?: string | null) => (s ? s.slice(0, 4) + "…" + s.slice(-4) : "");
