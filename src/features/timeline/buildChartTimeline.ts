import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import {
  buildHourlySamples,
  buildMinuteSamplesForHour,
} from "@/data/intradaySamples";
import type { AppLocale } from "@/lib/locale";
import { dailyReadingForMissionDay } from "@/lib/clinicalReading";
import { formatDayAxis, formatIntradayAxis } from "@/lib/missionTime";
import {
  CHART_MAX_POINTS,
  selectArchiveChartReadings,
} from "@/lib/telemetryArchive";
import type {
  ChartTimeGranularity,
  MissionTelemetryArchive,
  VitalReadings,
} from "@/types/health";

export interface ChartTimelineRow {
  axisLabel: string;
  missionDay: number;
  recordedAt: string;
  systolicBP: number;
  heartRate: number;
  heartRateMin?: number;
  heartRateMax?: number;
  sleepHours: number;
  bloodSugar: number;
  moodScore: number;
  stressLevel?: number;
  radiationMsv: number;
  radiationCumulative: number;
  reading: VitalReadings;
}

function resolveTimelineSource(history: VitalReadings[] | undefined): VitalReadings[] {
  const dailyOnly = (history ?? [])
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

function axisLabelForGranularity(
  reading: VitalReadings,
  granularity: ChartTimeGranularity,
  locale: AppLocale
): string {
  if (granularity === "days") {
    return formatDayAxis(reading.missionDay, reading.recordedAt, locale);
  }
  if (granularity === "hours") {
    const d = new Date(reading.recordedAt);
    const hour = String(d.getUTCHours()).padStart(2, "0");
    return `${hour}:00`;
  }
  return formatIntradayAxis(reading.recordedAt, locale);
}

function toChartRow(
  reading: VitalReadings,
  cumulative: number,
  granularity: ChartTimeGranularity,
  locale: AppLocale
): ChartTimelineRow {
  const displayDose =
    granularity === "days"
      ? reading.radiationMsv ?? 0
      : reading.radiationMsv ?? 0;
  return {
    axisLabel: axisLabelForGranularity(reading, granularity, locale),
    missionDay: reading.missionDay,
    recordedAt: reading.recordedAt,
    systolicBP: reading.systolicBP,
    heartRate: reading.heartRate,
    sleepHours: reading.sleepHours,
    bloodSugar: reading.bloodSugar,
    moodScore: reading.moodScore,
    radiationMsv: displayDose,
    radiationCumulative: Math.round(cumulative * 100) / 100,
    reading,
  };
}

export interface BuildChartTimelineInput {
  history: VitalReadings[];
  granularity: ChartTimeGranularity;
  locale: AppLocale;
  focusMissionDay: number | null;
  focusHourUtc: number | null;
  telemetryArchive?: MissionTelemetryArchive | null;
}

export function buildChartTimeline({
  history,
  granularity,
  locale,
  focusMissionDay,
  focusHourUtc,
  telemetryArchive = null,
}: BuildChartTimelineInput): { rows: ChartTimelineRow[]; source: VitalReadings[] } {
  const source =
    telemetryArchive?.daily?.length && granularity === "days"
      ? telemetryArchive.daily
      : resolveTimelineSource(history);

  let readings: VitalReadings[] = source;

  const archived =
    telemetryArchive &&
    selectArchiveChartReadings(
      telemetryArchive,
      source,
      granularity,
      focusMissionDay,
      focusHourUtc
    );

  if (archived !== null && granularity !== "days") {
    readings = archived;
  } else if (granularity === "hours") {
    if (focusMissionDay === null) {
      return { rows: [], source };
    }
    const daily =
      dailyReadingForMissionDay(source, focusMissionDay) ??
      source.find((r) => r.missionDay === focusMissionDay);
    readings = daily ? buildHourlySamples(daily) : [];
  } else if (granularity === "minutes") {
    if (focusMissionDay === null || focusHourUtc === null) {
      return { rows: [], source };
    }
    const daily =
      dailyReadingForMissionDay(source, focusMissionDay) ??
      source.find((r) => r.missionDay === focusMissionDay);
    readings = daily ? buildMinuteSamplesForHour(daily, focusHourUtc) : [];
  }

  let cumulative =
    granularity === "days"
      ? 0
      : source
          .filter((r) => focusMissionDay !== null && r.missionDay < focusMissionDay)
          .reduce((acc, r) => acc + (r.radiationMsv ?? 0), 0);

  const capped =
    readings.length > CHART_MAX_POINTS
      ? readings.filter(
          (_, i) => i % Math.ceil(readings.length / CHART_MAX_POINTS) === 0
        )
      : readings;

  const rows = capped.map((reading) => {
    cumulative += reading.radiationMsv ?? 0;
    return toChartRow(reading, cumulative, granularity, locale);
  });

  return { rows, source };
}