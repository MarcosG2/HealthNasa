import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import { buildIntradaySamples } from "@/data/intradaySamples";
import type { AppLocale } from "@/lib/locale";
import { formatDayAxis, formatIntradayAxis } from "@/lib/missionTime";
import type { ChartTimeGranularity, MissionEnvironment, VitalReadings } from "@/types/health";

export interface ChartTimelineRow {
  axisLabel: string;
  missionDay: number;
  recordedAt: string;
  systolicBP: number;
  heartRate: number;
  sleepHours: number;
  bloodSugar: number;
  moodScore: number;
  radiationMsv: number;
  radiationCumulative: number;
  reading: VitalReadings;
}

const INTRADAY_SLOTS: Record<Exclude<ChartTimeGranularity, "days">, number> = {
  hours: 24,
  minutes: 60,
};

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
    return locale === "es"
      ? `D${reading.missionDay} ${hour}:00`
      : `D${reading.missionDay} ${hour}:00`;
  }
  const time = formatIntradayAxis(reading.recordedAt, locale);
  return locale === "es" ? `D${reading.missionDay} ${time}` : `D${reading.missionDay} ${time}`;
}

function toChartRow(
  reading: VitalReadings,
  cumulative: number,
  granularity: ChartTimeGranularity,
  locale: AppLocale
): ChartTimelineRow {
  const dose = reading.radiationMsv ?? 0;
  return {
    axisLabel: axisLabelForGranularity(reading, granularity, locale),
    missionDay: reading.missionDay,
    recordedAt: reading.recordedAt,
    systolicBP: reading.systolicBP,
    heartRate: reading.heartRate,
    sleepHours: reading.sleepHours,
    bloodSugar: reading.bloodSugar,
    moodScore: reading.moodScore,
    radiationMsv: dose,
    radiationCumulative: Math.round(cumulative * 100) / 100,
    reading,
  };
}

export function buildChartTimeline(
  history: VitalReadings[],
  environment: MissionEnvironment,
  granularity: ChartTimeGranularity,
  locale: AppLocale
): { rows: ChartTimelineRow[]; source: VitalReadings[] } {
  const filtered = history.filter((h) => h.environment === environment);
  const source = filtered.length >= 10 ? filtered : buildMockMissionHistory(environment);

  const readings: VitalReadings[] =
    granularity === "days"
      ? source
      : source.flatMap((dayRow) =>
          buildIntradaySamples(dayRow, INTRADAY_SLOTS[granularity])
        );

  let cumulative = 0;
  const rows = readings.map((reading) => {
    cumulative += reading.radiationMsv ?? 0;
    return toChartRow(reading, cumulative, granularity, locale);
  });

  return { rows, source };
}