import type { DonkiFlareFeedResponse } from "@/types/health";

export async function fetchDonkiFlares(days = 30): Promise<DonkiFlareFeedResponse | null> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    const res = await fetch(`/api/donki/flr?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as DonkiFlareFeedResponse;
  } catch {
    return null;
  }
}