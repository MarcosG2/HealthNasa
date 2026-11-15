import { NextResponse } from "next/server";
import { MOCK_DONKI_FLARES } from "@/data/mockDonkiFlares";
import { buildFlareAlert } from "@/lib/donki/flareAlert";
import { fetchDonkiFlrRemote } from "@/lib/donki/fetchFlrRemote";
import type { DonkiFlareFeedResponse } from "@/types/health";

function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDays(value: string | null): number {
  const n = parseInt(value ?? "30", 10);
  if (Number.isNaN(n)) return 30;
  return Math.min(30, Math.max(1, n));
}

export async function GET(request: Request): Promise<NextResponse<DonkiFlareFeedResponse>> {
  const { searchParams } = new URL(request.url);
  const days = parseDays(searchParams.get("days"));

  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const startDate = utcDateString(start);
  const endDate = utcDateString(end);

  const nasaApiKey = process.env.NASA_API_KEY?.trim();
  const remote = await fetchDonkiFlrRemote(startDate, endDate, nasaApiKey);

  if (remote) {
    const alert = buildFlareAlert(remote.flares);
    const body: DonkiFlareFeedResponse = {
      ok: true,
      source: remote.source,
      startDate,
      endDate,
      flares: remote.flares,
      alert,
      note:
        remote.source === "nasa_donki_api"
          ? "Live NASA DONKI solar flare (FLR) feed."
          : "NASA api.nasa.gov DONKI unavailable; using CCMC DONKI-API mirror.",
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  }

  const alert = buildFlareAlert(MOCK_DONKI_FLARES);
  const body: DonkiFlareFeedResponse = {
    ok: true,
    source: "mock_ground_api",
    startDate,
    endDate,
    flares: MOCK_DONKI_FLARES,
    alert,
    note: "Fictional ground API fallback when NASA DONKI endpoints are unreachable.",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(body);
}