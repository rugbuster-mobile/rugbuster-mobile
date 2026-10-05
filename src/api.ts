export const API = "https://rugbuster-solana-api-production.up.railway.app";

export async function freeScan(mint: string): Promise<any> {
  const res = await fetch(`${API}/score?address=${encodeURIComponent(mint)}`);
  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`The API answered ${res.status} with no verdict.`);
  if (data.ok === false) throw new Error(data.error || "The API did not return a verdict.");
  return data;
}
