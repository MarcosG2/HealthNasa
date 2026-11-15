import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import { buildHourlySamples, buildMinuteSamplesForHour } from "@/data/intradaySamples";
import type { AppLocale } from "@/lib/locale";
import { dailyReadingForMissionDay } from "@/lib/clinicalReading";
import { formatDayAxis, formatIntradayAxis } from "@/lib/missionTime";
import {
  CHART_MAX_POINTS,
  dailyHeartRateRange,
  selectCardioArchiveReadings,
} from "@/lib/telemetryArchive";
import type {
  CardioChartScale,
  MissionTelemetryArchive,
  RadiationChartScale,
  RecoveryChartScale,
  VitalReadings,
} from "@/types/health";
import type { ChartTimelineRow } from "./buildChartTimeline";

export interface BuildPanelInput {
  history: VitalReadings[];
  locale: AppLocale;
  focusMissionDay: number | null;
  focusHourUtc: number | null;
  telemetryArchive?: MissionTelemetryArchive | null;
}

function resolveTimelineSource(history: VitalReadings[]): VitalReadings[] {
  const dailyOnly = history
    .filter((h) => h.extraMetrics?.intradaySlot === undefined)
    .sort((a, b) => a.missionDay - b.missionDay);
  if (dailyOnly.length >= 10) return dailyOnly;
  const env = dailyOnly[dailyOnly.length - 1]?.environment ?? "station";
  const mock = buildMockMissionHistory(env);
  const byDay = new Map<number, VitalReadings>();
  for (const row of mock) byDay.set(row.missionDay, row);
  for (const row of dailyOnly) byDay.set(row.missionDay, row);
  const sorted = [...byDay.values()].sort((a, b) => a.missionDay - b.missionDay);
  const latestDay = sorted[sorted.length - 1]?.missionDay ?? 14;
  if (sorted.length > 14) return sorted;
  const windowStart = Math.max(1, latestDay - 13);
  return sorted.filter((row) => row.missionDay >= windowStart);
}

function capReadings(readings: VitalReadings[]): VitalReadings[] {
  if (readings.length <= CHART_MAX_POINTS) return readings;
  const step = Math.ceil(readings.length / CHART_MAX_POINTS);
  return readings.filter((_, i) => i % step === 0);
}

function parseMinMax(reading: VitalReadings): { min: number; max: number } {
  const minRaw = reading.extraMetrics?.heartRateMin;
  const maxRaw = reading.extraMetrics?.heartRateMax;
  const min = typeof minRaw === "string" ? Number(minRaw) : undefined;
  const max = typeof maxRaw === "string" ? Number(maxRaw) : undefined;
  if (min !== undefined && !Number.isNaN(min) && max !== undefined && !Number.isNaN(max)) {
    return { min, max };
  }
  const dailyMax = reading.extraMetrics?.dailyMaxHeartRate;
  if (typeof dailyMax === "string") {
    const peak = Number(dailyMax);
    if (!Number.isNaN(peak)) {
      return { min: Math.max(42, peak - 55), max: peak };
    }
  }
  return {
    min: Math.max(42, reading.heartRate - 12),
    max: Math.min(185, reading.heartRate + 18),
  };
}

function axisForCardio(reading: VitalReadings, scale: CardioChartScale, locale: AppLocale): string {
  if (scale === "day") return formatDayAxis(reading.missionDay, reading.recordedAt, locale);
  if (scale === "minute") {
    const d = new Date(reading.recordedAt);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return formatIntradayAxis(reading.recordedAt, locale);
}

function toRow(
  reading: VitalReadings,
  axisLabel: string,
  cumulativeRadiation: number,
  extras?: Partial<ChartTimelineRow>
): ChartTimelineRow {
  const { min, max } = parseMinMax(reading);
  return {
    axisLabel,
    missionDay: reading.missionDay,
    recordedAt: reading.recordedAt,
    systolicBP: reading.systolicBP,
    heartRate: reading.heartRate,
    heartRateMin: extras?.heartRateMin ?? min,
    heartRateMax: extras?.heartRateMax ?? max,
    sleepHours: reading.sleepHours,
    bloodSugar: reading.bloodSugar,
    moodScore: reading.moodScore,
    stressLevel: reading.stressLevel ?? 3,
    radiationMsv: reading.radiationMsv ?? 0,
    radiationCumulative: Math.round(cumulativeRadiation * 100) / 100,
    reading,
  };
}

export function buildCardioTimeline({
  history,
  locale,
  focusMissionDay,
  focusHourUtc,
  telemetryArchive = null,
  scale,
}: BuildPanelInput & { scale: CardioChartScale }): {
  rows: ChartTimelineRow[];
  source: VitalReadings[];
} {
  const source =
    telemetryArchive?.daily?.length && scale === "day"
      ? telemetryArchive.daily
      : resolveTimelineSource(history);

  let readings: VitalReadings[] = source;

  if (telemetryArchive) {
    const archived = selectCardioArchiveReadings(
      telemetryArchive,
      source,
      scale,
      focusMissionDay,
      focusHourUtc
    );
    if (archived !== null) readings = archived;
  } else if (scale === "day") {
    readings = source;
  } else if (scale === "minute") {
    if (focusMissionDay === null) return { rows: [], source };
    const daily =
      dailyReadingForMissionDay(source, focusMissionDay) ??
      source.find((r) => r.missionDay === focusMissionDay);
    if (!daily) return { rows: [], source };
    readings = buildHourlySamples(daily).flatMap((h) =>
      buildMinuteSamplesForHour(daily, new Date(h.recordedAt).getUTCHours(), 12)
    );
  } else {
    if (focusMissionDay === null || focusHourUtc === null) return { rows: [], source };
    const daily =
      dailyReadingForMissionDay(source, focusMissionDay) ??
      source.find((r) => r.missionDay === focusMissionDay);
    readings = daily ? buildMinuteSamplesForHour(daily, focusHourUtc, 12) : [];
  }

  readings = capReadings(readings);

  const rows = readings.map((reading) => {
    let minMax = parseMinMax(reading);
    if (scale === "day" && telemetryArchive) {
      const range = dailyHeartRateRange(telemetryArchive, reading.missionDay);
      if (range) {
        minMax = range;
        reading = {
          ...reading,
          heartRate: range.avg,
          extraMetrics: {
            ...reading.extraMetrics,
            heartRateMin: String(range.min),
            heartRateMax: String(range.max),
          },
        };
      }
    }
    return toRow(reading, axisForCardio(reading, scale, locale), 0, {
      heartRateMin: minMax.min,
      heartRateMax: minMax.max,
    });
  });

  return { rows, source };
}

export function buildRecoveryTimeline({
  history,
  locale,
  focusMissionDay,
  telemetryArchive = null,
  scale,
}: BuildPanelInput & { scale: RecoveryChartScale }): {
  rows: ChartTimelineRow[];
  source: VitalReadings[];
} {
  const source =
    telemetryArchive?.daily?.length
      ? telemetryArchive.daily
      : resolveTimelineSource(history);

  let readings: VitalReadings[] = source;
  if (scale === "hour") {
    if (focusMissionDay === null) return { rows: [], source };
    const daily =
      dailyReadingForMissionDay(source, focusMissionDay) ??
      source.find((r) => r.missionDay === focusMissionDay);
    const archiveHours = telemetryArchive?.rollups?.hour?.filter(
      (b) => b.missionDay === focusMissionDay
    );
    if (archiveHours && archiveHours.length > 0 && daily) {
      readings = archiveHours.map((b) => {
        const hour = new Date(b.bucketStart).getUTCHours();
        return {
          ...daily,
          recordedAt: b.bucketStart,
          missionDay: focusMissionDay,
          bloodSugar: b.bloodSugarAvg ?? daily.bloodSugar,
          temperature: b.temperatureAvg ?? daily.temperature,
          moodScore: Math.round(b.moodAvg ?? daily.moodScore),
          stressLevel: Math.round(b.stressAvg ?? daily.stressLevel ?? 3),
          heartRate: b.heartRateAvg,
          systolicBP: b.systolicAvg,
          extraMetrics: {
            ...daily.extraMetrics,
            intradaySlot: String(hour),
            sampleKind: "hour",
            telemetryLayer: "rollup",
          },
        };
      });
    } else {
      readings = daily ? buildHourlySamples(daily) : [];
    }
  }

  let cumulative = 0;
  const rows = readings.map((reading) => {
    cumulative += reading.radiationMsv ?? 0;
    const axisLabel =
      scale === "day"
        ? formatDayAxis(reading.missionDay, reading.recordedAt, locale)
        : `${String(new Date(reading.recordedAt).getUTCHours()).padStart(2, "0")}:00`;
    return toRow(reading, axisLabel, cumulative);
  });

  return { rows, source };
}

export function buildRadiationTimeline({
  history,
  locale,
  focusMissionDay,
  telemetryArchive = null,
  scale,
}: BuildPanelInput & { scale: RadiationChartScale }): {
  rows: ChartTimelineRow[];
  source: VitalReadings[];
} {
  const source =
    telemetryArchive?.daily?.length
      ? telemetryArchive.daily
      : resolveTimelineSource(history);

  let readings: VitalReadings[] = source;
  if (scale === "hour") {
    if (focusMissionDay === null) return { rows: [], source };
    const daily =
      dailyReadingForMissionDay(source, focusMissionDay) ??
      source.find((r) => r.missionDay === focusMissionDay);
    const archiveHours = telemetryArchive?.rollups?.hour?.filter(
      (b) => b.missionDay === focusMissionDay
    );
    if (archiveHours && archiveHours.length > 0 && daily) {
      readings = archiveHours.map((b) => {
        const hour = new Date(b.bucketStart).getUTCHours();
        return {
          ...daily,
          recordedAt: b.bucketStart,
          missionDay: focusMissionDay,
          radiationMsv: b.radiationDose ?? (daily.radiationMsv ? daily.radiationMsv / 24 : 0.02),
          extraMetrics: {
            ...daily.extraMetrics,
            intradaySlot: String(hour),
            sampleKind: "hour",
            telemetryLayer: "rollup",
          },
        };
      });
    } else {
      readings = daily ? buildHourlySamples(daily) : [];
    }
  }

  const priorDose =
    scale === "hour" && focusMissionDay !== null
      ? source
          .filter((r) => r.missionDay < focusMissionDay)
          .reduce((acc, r) => acc + (r.radiationMsv ?? 0), 0)
      : 0;

  let cumulative = scale === "day" ? 0 : priorDose;
  const rows = readings.map((reading) => {
    cumulative += reading.radiationMsv ?? 0;
    const axisLabel =
      scale === "day"
        ? formatDayAxis(reading.missionDay, reading.recordedAt, locale)
        : `${String(new Date(reading.recordedAt).getUTCHours()).padStart(2, "0")}:00`;
    return toRow(reading, axisLabel, cumulative);
  });

  return { rows, source };
}