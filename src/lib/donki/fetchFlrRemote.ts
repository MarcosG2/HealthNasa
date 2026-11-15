import type { DonkiFlareRecord } from "@/types/health";

const NASA_DONKI_FLR = "https://api.nasa.gov/DONKI/FLR";
const CCMC_DONKI_FLR = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR";
const FETCH_TIMEOUT_MS = 12_000;

function isDonkiFlareRecord(value: unknown): value is DonkiFlareRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.flrID === "string" &&
    typeof row.classType === "string" &&
    typeof row.peakTime === "string"
  );
}

function parseFlareArray(payload: unknown): DonkiFlareRecord[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter(isDonkiFlareRecord).map((row) => ({
    flrID: row.flrID,
    beginTime: row.beginTime,
    peakTime: row.peakTime,
    endTime: row.endTime,
    classType: row.classType,
    sourceLocation: row.sourceLocation,
    activeRegionNum:
      typeof row.activeRegionNum === "number" ? row.activeRegionNum : undefined,
    link: typeof row.link === "string" ? row.link : undefined,
    linkedEvents: row.linkedEvents ?? null,
  }));
}

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export type RemoteFlareSource = "nasa_donki_api" | "ccmc_donki_api";

export interface RemoteFlareFetchResult {
  flares: DonkiFlareRecord[];
  source: RemoteFlareSource;
}

export async function fetchDonkiFlrRemote(
  startDate: string,
  endDate: string,
  nasaApiKey: string | undefined
): Promise<RemoteFlareFetchResult | null> {
  const query = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

  if (nasaApiKey) {
    try {
      const url = `${NASA_DONKI_FLR}?${query}&api_key=${encodeURIComponent(nasaApiKey)}`;
      const json = await fetchJsonWithTimeout(url);
      const flares = parseFlareArray(json);
      return { flares, source: "nasa_donki_api" };
    } catch {
      /* fall through to CCMC */
    }
  }

  try {
    const url = `${CCMC_DONKI_FLR}?${query}`;
    const json = await fetchJsonWithTimeout(url);
    const flares = parseFlareArray(json);
    return { flares, source: "ccmc_donki_api" };
  } catch {
    return null;
  }
}