import { netFetch } from "./net";

export const API = "https://rugbuster-solana-api-production.up.railway.app";

export async function freeScan(mint: string): Promise<any> {
  const res = await netFetch(`${API}/score?address=${encodeURIComponent(mint)}`);
  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`The API answered ${res.status} with no verdict.`);
  if (data.ok === false) throw new Error(data.error || "The API did not return a verdict.");
  return data;
}

export type FeedItem = {
  address: string;
  label: string;
  risk_score: number | null;
  name: string | null;
  symbol: string | null;
  scanned_at: string;
  reason: string | null;
};

export async function loadFeed(): Promise<FeedItem[]> {
  const res = await netFetch(`${API}/feed`);
  const data = await res.json();
  return data?.items || [];
}

export const tokenImage = (mint: string) => `${API}/token-image?address=${mint}`;
