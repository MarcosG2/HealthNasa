import type { VitalReadings } from "@/types/health";

export function isIntradaySample(reading: VitalReadings): boolean {
  return reading.extraMetrics?.intradaySlot !== undefined;
}

/** Daily rollup for thresholds; intraday vitals (HR, BP, etc.) stay from the selected instant. */
export function clinicalReadingForEvaluation(
  sample: VitalReadings,
  history: VitalReadings[]
): VitalReadings {
  if (!isIntradaySample(sample)) return sample;
  const daily = history.find((h) => h.missionDay === sample.missionDay);
  if (!daily) return sample;
  return {
    ...sample,
    sleepHours: daily.sleepHours,
    radiationMsv: daily.radiationMsv,
    moodScore: daily.moodScore,
    stressLevel: daily.stressLevel ?? sample.stressLevel,
  };
}

export function dailyReadingForMissionDay(
  history: VitalReadings[],
  missionDay: number
): VitalReadings | undefined {
  return history.find((h) => h.missionDay === missionDay && !isIntradaySample(h));
}