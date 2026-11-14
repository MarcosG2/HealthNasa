import type {
  CardioChartScale,
  ChartTimeGranularity,
  MissionTelemetryArchive,
  TelemetryHotSample,
  TelemetryRollupBucket,
  VitalReadings,
} from "@/types/health";

const ARCHIVE_URLS = [
  "/data/mission-telemetry-60d.json",
  "/data/mission-telemetry-30d.json",
] as const;

export async function fetchMissionTelemetryArchive(): Promise<MissionTelemetryArchive | null> {
  if (typeof window === "undefined") return null;
  for (const url of ARCHIVE_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = (await res.json()) as MissionTelemetryArchive;
      if (data?.meta?.version === 1 && data.daily?.length) return data;
    } catch {
      /* try next */
    }
  }
  return null;
}

function rollupToReading(
  bucket: TelemetryRollupBucket,
  template: VitalReadings,
  slotLabel: string,
  sampleKind: "hour" | "minute"
): VitalReadings {
  return {
    ...template,
    recordedAt: bucket.bucketStart,
    missionDay: bucket.missionDay,
    heartRate: bucket.heartRateAvg,
    systolicBP: bucket.systolicAvg,
    extraMetrics: {
      ...template.extraMetrics,
      intradaySlot: slotLabel,
      sampleKind,
      telemetryLayer: "rollup",
      heartRateMin: String(bucket.heartRateMin),
      heartRateMax: String(bucket.heartRateMax),
    },
  };
}

function bucketBelongsToHour(bucket: TelemetryRollupBucket, hourUtc: number): boolean {
  return new Date(bucket.bucketStart).getUTCHours() === hourUtc;
}

function downsampleHotToFiveMinuteSlots(
  hotInHour: TelemetryHotSample[],
  template: VitalReadings
): VitalReadings[] {
  if (hotInHour.length === 0) return [];
  const hour = new Date(hotInHour[0].recordedAt).getUTCHours();
  const slots: TelemetryHotSample[][] = Array.from({ length: 12 }, () => []);
  for (const row of hotInHour) {
    const d = new Date(row.recordedAt);
    const slot = Math.min(11, Math.floor((d.getUTCMinutes() * 60 + d.getUTCSeconds()) / 300));
    slots[slot].push(row);
  }
  const readings: VitalReadings[] = [];
  slots.forEach((group, slot) => {
    if (!group.length) return;
    const avgHr = Math.round(
      group.reduce((s, g) => s + g.heartRate, 0) / group.length
    );
    const avgSys = Math.round(
      group.reduce((s, g) => s + g.systolicBP, 0) / group.length
    );
    const mid = group[Math.floor(group.length / 2)];
    readings.push({
      ...template,
      recordedAt: mid.recordedAt,
      missionDay: mid.missionDay,
      heartRate: avgHr,
      systolicBP: avgSys,
      diastolicBP: group[0].diastolicBP,
      bloodSugar: group[0].bloodSugar,
      temperature: group[0].temperature,
      extraMetrics: {
        ...template.extraMetrics,
        intradaySlot: `${hour}:${slot}`,
        sampleKind: "minute",
        telemetryLayer: "hot-rollup",
        focusHourUtc: String(hour),
      },
    });
  });
  return readings;
}

export function dailyHeartRateRange(
  archive: MissionTelemetryArchive,
  missionDay: number
): { min: number; max: number; avg: number } | null {
  const buckets = archive.rollups.minute.filter((b) => b.missionDay === missionDay);
  if (!buckets.length) return null;
  const min = Math.min(...buckets.map((b) => b.heartRateMin));
  const max = Math.max(...buckets.map((b) => b.heartRateMax));
  const avg = Math.round(
    buckets.reduce((s, b) => s + b.heartRateAvg, 0) / buckets.length
  );
  return { min, max, avg };
}

function hotSamplesToReadings(
  samples: TelemetryHotSample[],
  template: VitalReadings,
  hourUtc: number
): VitalReadings[] {
  return samples.map((sample, index) => ({
    ...template,
    recordedAt: sample.recordedAt,
    missionDay: sample.missionDay,
    heartRate: sample.heartRate,
    systolicBP: sample.systolicBP,
    diastolicBP: sample.diastolicBP,
    bloodSugar: sample.bloodSugar,
    temperature: sample.temperature,
    extraMetrics: {
      ...template.extraMetrics,
      intradaySlot: `${hourUtc}:5s:${index}`,
      sampleKind: "5sec",
      telemetryLayer: "hot",
      focusHourUtc: String(hourUtc),
    },
  }));
}

/** Cardiovascular panel data from the layered archive */
export function selectCardioArchiveReadings(
  archive: MissionTelemetryArchive,
  dailySource: VitalReadings[],
  scale: CardioChartScale,
  focusMissionDay: number | null,
  focusHourUtc: number | null
): VitalReadings[] | null {
  const template =
    (focusMissionDay !== null
      ? dailySource.find((d) => d.missionDay === focusMissionDay) ??
        archive.daily.find((d) => d.missionDay === focusMissionDay)
      : undefined) ?? archive.daily[archive.daily.length - 1];
  if (!template) return null;

  if (scale === "day") {
    return archive.daily.map((daily) => {
      const range = dailyHeartRateRange(archive, daily.missionDay);
      if (!range) return daily;
      return {
        ...daily,
        heartRate: range.avg,
        extraMetrics: {
          ...daily.extraMetrics,
          heartRateMin: String(range.min),
          heartRateMax: String(range.max),
        },
      };
    });
  }

  if (focusMissionDay === null) return [];

  if (scale === "minute") {
    const minutes = archive.rollups.minute
      .filter((b) => b.missionDay === focusMissionDay)
      .sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));
    return minutes.map((b) => {
      const d = new Date(b.bucketStart);
      return {
        ...template,
        recordedAt: b.bucketStart,
        missionDay: focusMissionDay,
        heartRate: b.heartRateAvg,
        systolicBP: b.systolicAvg,
        extraMetrics: {
          ...template.extraMetrics,
          intradaySlot: `${d.getUTCHours()}:${d.getUTCMinutes()}`,
          sampleKind: "minute",
          telemetryLayer: "rollup",
          heartRateMin: String(b.heartRateMin),
          heartRateMax: String(b.heartRateMax),
        },
      };
    });
  }

  if (focusHourUtc === null) return [];

  const hotInHour = archive.hot.filter((s) => {
    if (s.missionDay !== focusMissionDay) return false;
    return new Date(s.recordedAt).getUTCHours() === focusHourUtc;
  });
  if (hotInHour.length > 0) {
    return hotSamplesToReadings(hotInHour, template, focusHourUtc);
  }

  return archive.rollups.minute
    .filter((b) => b.missionDay === focusMissionDay && bucketBelongsToHour(b, focusHourUtc))
    .sort((a, b) => a.bucketStart.localeCompare(b.bucketStart))
    .map((b) => rollupToReading(b, template, `${focusHourUtc}:${new Date(b.bucketStart).getUTCMinutes()}`, "minute"));
}

export function selectArchiveChartReadings(
  archive: MissionTelemetryArchive,
  dailySource: VitalReadings[],
  granularity: ChartTimeGranularity,
  focusMissionDay: number | null,
  focusHourUtc: number | null
): VitalReadings[] | null {
  const daily =
    dailySource.find((d) => d.missionDay === focusMissionDay) ??
    archive.daily.find((d) => d.missionDay === focusMissionDay);
  const template = daily ?? archive.daily[archive.daily.length - 1];
  if (!template) return null;

  if (granularity === "days") {
    return archive.daily;
  }

  if (focusMissionDay === null) return [];

  if (granularity === "hours") {
    const hours = archive.rollups.hour.filter((b) => b.missionDay === focusMissionDay);
    return hours.map((b) => {
      const hour = new Date(b.bucketStart).getUTCHours();
      return rollupToReading(b, template, String(hour), "hour");
    });
  }

  if (focusHourUtc === null) return [];

  const hotInHour = archive.hot.filter((s) => {
    if (s.missionDay !== focusMissionDay) return false;
    return new Date(s.recordedAt).getUTCHours() === focusHourUtc;
  });

  if (hotInHour.length > 0) {
    return downsampleHotToFiveMinuteSlots(hotInHour, template);
  }

  const minuteBuckets = archive.rollups.minute.filter(
    (b) => b.missionDay === focusMissionDay && bucketBelongsToHour(b, focusHourUtc)
  );

  const grouped = new Map<number, TelemetryRollupBucket[]>();
  for (const b of minuteBuckets) {
    const minute = new Date(b.bucketStart).getUTCMinutes();
    const slot = Math.floor(minute / 5);
    const list = grouped.get(slot) ?? [];
    list.push(b);
    grouped.set(slot, list);
  }

  const readings: VitalReadings[] = [];
  for (let slot = 0; slot < 12; slot += 1) {
    const buckets = grouped.get(slot);
    if (!buckets?.length) continue;
    const hrAvg = Math.round(
      buckets.reduce((s, b) => s + b.heartRateAvg, 0) / buckets.length
    );
    const hrMin = Math.min(...buckets.map((b) => b.heartRateMin));
    const hrMax = Math.max(...buckets.map((b) => b.heartRateMax));
    const sysAvg = Math.round(
      buckets.reduce((s, b) => s + b.systolicAvg, 0) / buckets.length
    );
    readings.push({
      ...template,
      recordedAt: buckets[0].bucketStart,
      missionDay: focusMissionDay,
      heartRate: hrAvg,
      systolicBP: sysAvg,
      extraMetrics: {
        ...template.extraMetrics,
        intradaySlot: `${focusHourUtc}:${slot}`,
        sampleKind: "minute",
        telemetryLayer: "rollup",
        heartRateMin: String(hrMin),
        heartRateMax: String(hrMax),
        focusHourUtc: String(focusHourUtc),
      },
    });
  }

  return readings.sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
}

/** Max points to feed Recharts per panel — safety cap for any legacy full-resolution path */
export const CHART_MAX_POINTS = 2000;