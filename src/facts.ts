// Facts, one per row, read straight from the API answer and never inferred.
// The same reading as the Creator Trace page and the Chrome extension, with the
// transaction behind each finding attached so a reader can check it on Solscan.

import { short } from "./mint";

export type Tone = "danger" | "warn" | "good" | "muted";
export type Proof = { label: string; href: string };
export type Fact = { tone: Tone; head: string; body: string; proof: Proof[] };

const txLink = (label: string, sig?: string | null): Proof | null =>
  sig ? { label, href: `https://solscan.io/tx/${sig}` } : null;
const acctLink = (label: string, addr?: string | null): Proof | null =>
  addr ? { label, href: `https://solscan.io/account/${addr}` } : null;
const clean = (links: (Proof | null)[]) => links.filter(Boolean) as Proof[];

function seconds(value: unknown): string | null {
  if (typeof value !== "number" || value < 0) return null;
  if (value < 90) return Math.round(value) + " s";
  if (value < 5400) return Math.round(value / 60) + " min";
  if (value < 172800) return Math.round(value / 3600) + " h";
  return Math.round(value / 86400) + " days";
}

function joinWords(parts: string[]) {
  return parts.length < 2 ? parts.join("") : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

// Who made the copies (the API's name_copies.makers), in one or two sentences.
export function makersLine(m: any): { text: string; linked: boolean; proof: Proof | null } {
  if (!m || !m.status) return { text: "", linked: false, proof: null };
  if (m.status === "checking" || m.status === "busy") {
    return { text: "Checking who made these copies, about 30 seconds…", linked: false, proof: null };
  }
  if (m.status !== "ok" || !m.creators_read) return { text: "", linked: false, proof: null };
  const creator = (m.shared_creators || [])[0];
  if (creator) {
    const more = (m.shared_creators || []).length - 1;
    return {
      text: `${creator.count} of ${m.checked} copies checked were launched by the same wallet (${short(creator.wallet)})` +
        (creator.includes_most_traded ? ", including the most traded one" : "") + "." +
        (more > 0 ? ` ${more} more wallet${more > 1 ? "s" : ""} made two or more.` : ""),
      linked: true,
      proof: acctLink("maker", creator.wallet),
    };
  }
  const funder = (m.shared_funders || [])[0];
  if (funder) {
    return {
      text: `The creators of ${funder.count} of ${m.checked} copies checked were funded by the same wallet (${short(funder.wallet)}).`,
      linked: true,
      proof: acctLink("funder", funder.wallet),
    };
  }
  return {
    text: `${m.checked} copies checked: ${m.distinct_creators} different creators, no shared maker or funder` +
      (m.exchange_funded ? ` (${m.exchange_funded} funded from exchanges, which links nothing).` : "."),
    linked: false,
    proof: null,
  };
}

export function facts(d: any): Fact[] {
  const out: Fact[] = [];
  const label = String(d.label || "").toUpperCase();
  const cp = d.creator_position || {};
  const ls = d.launch_snipe || {};
  const dh = d.deployer_history || {};
  const cc = d.chain_checks || {};

  // Powers the token's authorities hold right now. Without this row a contract
  // verdict would show DANGER with no reason next to it.
  const k = cc.contract || {};
  if (k.status === "ok") {
    const ext = k.extensions || {};
    const powers: string[] = [];
    if (ext.permanent_delegate) powers.push("move tokens out of any wallet");
    if (k.freeze_authority) powers.push("freeze wallets");
    if (k.mint_authority) powers.push("mint more");
    if (ext.transfer_hook_program) powers.push("run its own program on every transfer");
    if (typeof ext.transfer_fee_bps === "number" && ext.transfer_fee_bps > 0) {
      powers.push("take " + ext.transfer_fee_bps / 100 + "% of every transfer");
    }
    if (powers.length) {
      out.push({
        tone: label === "GOOD" ? "muted" : ext.permanent_delegate ? "danger" : "warn",
        head: "Contract powers",
        body: "Whoever holds this token's authorities can " + joinWords(powers) + ".",
        proof: [],
      });
    }
  }

  const share = typeof cp.share_at_creation_pct === "number" ? cp.share_at_creation_pct : cp.peak_share_pct;
  if (cp.status === "sold" && typeof share === "number") {
    const when = seconds(cp.sold_after_seconds);
    out.push({
      tone: share >= 1 ? "danger" : "muted",
      head: "Creator sold out",
      body: `Bought ${share.toFixed(1)}% of supply at creation, sold it${when ? (cp.sold_after_is_upper_bound ? " within " : " after ") + when : ""}.`,
      proof: clean([txLink("buy tx", cp.first_buy_signature), txLink("sell tx", cp.exit_signature)]),
    });
  } else if (cp.status === "holding" && typeof share === "number" && share >= 1) {
    out.push({
      tone: "warn",
      head: "Creator still holds",
      body: `${(cp.current_share_pct ?? share).toFixed(1)}% of supply, bought when the token was created. Nothing stops a sale.`,
      proof: clean([txLink("buy tx", cp.first_buy_signature)]),
    });
  } else if (cp.status === "holding") {
    out.push({ tone: "muted", head: "Creator position", body: "The creator holds under 1% of supply.", proof: [] });
  } else if (cp.status === "none") {
    out.push({ tone: "muted", head: "Creator position", body: "The creator's own wallet never held this token.", proof: [] });
  }

  if (ls.status === "sniped") {
    const buys = [...new Set((ls.first_buyers || []).map((b: any) => b.signature).filter(Boolean))].slice(0, 3) as string[];
    out.push({
      tone: "warn",
      head: "Launch taken by bots",
      body: `${ls.buyers_within_window} wallets bought in the first ${ls.window_seconds} s; ${ls.bot_wallets_among_checked} of ${ls.wallets_checked} checked are bot wallets.`,
      proof: clean([txLink("creation tx", ls.creation_signature), ...buys.map((sig, i) => txLink(`buy ${i + 1}`, sig))]),
    });
  } else if (ls.status === "clean") {
    out.push({ tone: "good", head: "Launch", body: `No crowd in the first ${ls.window_seconds} s.`, proof: [] });
  }

  if (typeof dh.prior_rugs_on_record === "number" && dh.prior_rugs_on_record > 0) {
    out.push({ tone: "danger", head: "Creator's record", body: `${dh.prior_rugs_on_record} earlier token(s) by this creator rugged.`, proof: [] });
  }

  const f = cc.funding || {};
  if (f.status === "ok") {
    const before = seconds(f.seconds_before_creation);
    out.push({
      tone: "muted",
      head: "Creator funding",
      body: `${f.amount_sol} SOL from ${short(f.funder)}${before ? `, ${before} before the token` : ""}.`,
      proof: clean([txLink("funding tx", f.signature), acctLink("funder", f.funder)]),
    });
  } else if (f.status === "busy_wallet") {
    out.push({ tone: "muted", head: "Creator funding", body: "The creator wallet has 1,000+ transactions; its first funding is out of reach.", proof: [] });
  }

  // Other tokens launched under the same ticker in the last day. A busy ticker
  // says nothing about this token's honesty; it says the address matters.
  const nc = d.name_copies || {};
  const copies = nc.same_symbol_last_24h;
  if (nc.status === "ok" && typeof copies === "number" && copies > 0) {
    const top = nc.most_traded;
    const other = top && !top.is_this_token;
    const count = `${copies}${nc.results_capped ? "+" : ""} other Solana token${copies === 1 && !nc.results_capped ? "" : "s"}`;
    const makers = makersLine(nc.makers);
    out.push({
      tone: copies >= 5 || other || makers.linked ? "warn" : "muted",
      head: "Copies of this name",
      body: `${count} named ${nc.symbol} launched in the last 24 h.` +
        (other ? ` The most traded one is ${short(top.mint)}; check you have the right address.`
          : top && top.is_this_token ? " This one trades the most of them." : "") +
        (makers.text ? " " + makers.text : ""),
      proof: clean([other ? { label: "most traded", href: `https://dexscreener.com/solana/${top.mint}` } : null, makers.proof]),
    });
  }

  const h = cc.holders || {};
  if (h.status === "ok" && typeof h.top10_wallet_pct === "number") {
    out.push({
      tone: "muted",
      head: "Holders",
      body: h.program_held_pct >= 99 && h.top10_wallet_pct < 1
        ? "All supply sits in the bonding curve or pool: holders have sold out."
        : `Top 10 wallets hold ${h.top10_wallet_pct.toFixed(1)}%; largest ${h.largest_wallet_pct.toFixed(1)}%.`,
      proof: [],
    });
  }
  return out;
}
