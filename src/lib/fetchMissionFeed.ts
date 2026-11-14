import type { FakerMissionFeed } from "@/lib/fakerMissionTelemetry";
import type { MissionEnvironment } from "@/types/health";

export interface MissionFeedResponse extends FakerMissionFeed {
  ok: boolean;
  source: string;
  note: string;
}

export async function fetchMissionFeed(
  environment: MissionEnvironment,
  days = 14,
  astronautId?: string
): Promise<MissionFeedResponse | null> {
  try {
    const params = new URLSearchParams({
      environment,
      days: String(days),
    });
    if (astronautId) params.set("astronautId", astronautId);
    const res = await fetch(`/api/mission-feed?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MissionFeedResponse;
  } catch {
    return null;
  }
}

export async function fetchAstronautRoster(): Promise<
  import("@/types/health").MockAstronautProfile[] | null
> {
  try {
    const res = await fetch("/api/mission-feed/roster", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { roster?: import("@/types/health").MockAstronautProfile[] };
    return data.roster ?? null;
  } catch {
    return null;
  }
}