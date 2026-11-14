import type { MissionScenarioId, VitalReadings } from "@/types/health";

function hasSolarSignature(reading: VitalReadings): boolean {
  return (
    (reading.radiationMsv ?? 0) >= 1.4 &&
    reading.heartRate >= 100 &&
    (reading.extraMetrics?.fatigueLevel === "elevated" ||
      (reading.sleepHours ?? 8) < 6)
  );
}

function hasCardioSignature(reading: VitalReadings): boolean {
  return reading.systolicBP >= 155 && reading.heartRate >= 115;
}

function hasIsolationSignature(reading: VitalReadings): boolean {
  return (
    reading.sleepHours <= 4.5 &&
    (reading.stressLevel ?? 0) >= 7 &&
    (reading.moodScore ?? 5) <= 3
  );
}

export function detectMissionScenarios(reading: VitalReadings): MissionScenarioId[] {
  const active: MissionScenarioId[] = [];
  if (hasSolarSignature(reading)) active.push("solar");
  if (hasCardioSignature(reading)) active.push("cardio");
  if (hasIsolationSignature(reading)) active.push("isolation");
  return active;
}

/** @deprecated Use detectMissionScenarios */
export function detectMissionScenario(reading: VitalReadings): MissionScenarioId | null {
  const list = detectMissionScenarios(reading);
  return list[0] ?? null;
}