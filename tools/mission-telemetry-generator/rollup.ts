import type {
  TelemetryHotSample,
  TelemetryRollupBucket,
} from "../../src/types/health";

interface RollupAcc {
  heartRateSum: number;
  heartRateMin: number;
  heartRateMax: number;
  systolicSum: number;
  count: number;
}

function bucketKey(iso: string, kind: "minute" | "hour"): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  const day = d.getUTCDate();
  const h = d.getUTCHours();
  if (kind === "hour") {
    return `${y}-${mo}-${day}T${h}`;
  }
  const m = d.getUTCMinutes();
  return `${y}-${mo}-${day}T${h}:${m}`;
}

function bucketStartFromKey(key: string, kind: "minute" | "hour"): string {
  if (kind === "hour") {
    const [datePart, hourPart] = key.split("T");
    return `${datePart}T${hourPart.padStart(2, "0")}:00:00.000Z`;
  }
  const [datePart, hm] = key.split("T");
  const [hourPart, minPart] = hm.split(":");
  return `${datePart}T${hourPart.padStart(2, "0")}:${minPart.padStart(2, "0")}:00.000Z`;
}

function flushBucket(
  key: string,
  acc: RollupAcc,
  missionDay: number,
  kind: "minute" | "hour"
): TelemetryRollupBucket {
  return {
    bucketStart: bucketStartFromKey(key, kind),
    missionDay,
    bucketKind: kind,
    heartRateAvg: Math.round(acc.heartRateSum / acc.count),
    heartRateMin: acc.heartRateMin,
    heartRateMax: acc.heartRateMax,
    systolicAvg: Math.round(acc.systolicSum / acc.count),
    sampleCount: acc.count,
  };
}

export function buildRollups(
  samples: TelemetryHotSample[],
  fullMissionSamples: TelemetryHotSample[]
): { minute: TelemetryRollupBucket[]; hour: TelemetryRollupBucket[] } {
  const source = fullMissionSamples.length ? fullMissionSamples : samples;
  return {
    minute: aggregate(source, "minute"),
    hour: aggregate(source, "hour"),
  };
}

function aggregate(
  samples: TelemetryHotSample[],
  kind: "minute" | "hour"
): TelemetryRollupBucket[] {
  const map = new Map<string, RollupAcc & { missionDay: number }>();
  for (const row of samples) {
    const key = bucketKey(row.recordedAt, kind);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        missionDay: row.missionDay,
        heartRateSum: row.heartRate,
        heartRateMin: row.heartRate,
        heartRateMax: row.heartRate,
        systolicSum: row.systolicBP,
        count: 1,
      });
      continue;
    }
    existing.heartRateSum += row.heartRate;
    existing.heartRateMin = Math.min(existing.heartRateMin, row.heartRate);
    existing.heartRateMax = Math.max(existing.heartRateMax, row.heartRate);
    existing.systolicSum += row.systolicBP;
    existing.count += 1;
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, acc]) => flushBucket(key, acc, acc.missionDay, kind));
}