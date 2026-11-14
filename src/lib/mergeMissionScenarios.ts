import {
  cardioDehydrationScenario,
  isolationDriftScenario,
  solarParticleScenario,
} from "@/data/mockMissionHistory";
import type { MissionEnvironment, MissionScenarioId, VitalReadings } from "@/types/health";

export const SCENARIO_APPLY_ORDER: MissionScenarioId[] = [
  "solar",
  "cardio",
  "isolation",
];

function scenarioFactory(
  id: MissionScenarioId
): (environment: MissionEnvironment) => VitalReadings {
  switch (id) {
    case "solar":
      return solarParticleScenario;
    case "cardio":
      return cardioDehydrationScenario;
    case "isolation":
      return isolationDriftScenario;
  }
}

function mergeVitalPair(base: VitalReadings, patch: VitalReadings): VitalReadings {
  return {
    ...base,
    systolicBP: Math.max(base.systolicBP, patch.systolicBP),
    diastolicBP: Math.max(base.diastolicBP, patch.diastolicBP),
    heartRate: Math.max(base.heartRate, patch.heartRate),
    bloodSugar: Math.max(base.bloodSugar, patch.bloodSugar),
    temperature: Math.max(base.temperature, patch.temperature),
    radiationMsv: Math.max(base.radiationMsv ?? 0, patch.radiationMsv ?? 0),
    sleepHours: Math.min(base.sleepHours, patch.sleepHours),
    moodScore: Math.min(base.moodScore, patch.moodScore),
    stressLevel: Math.max(base.stressLevel ?? 0, patch.stressLevel ?? 0),
    extraMetrics: { ...base.extraMetrics, ...patch.extraMetrics },
  };
}

/** Layer one or more mission scenarios onto a baseline reading (same mission day). */
export function mergeActiveScenarios(
  baseline: VitalReadings,
  active: MissionScenarioId[],
  environment: MissionEnvironment
): VitalReadings {
  let merged: VitalReadings = { ...baseline, environment };
  for (const id of SCENARIO_APPLY_ORDER) {
    if (!active.includes(id)) continue;
    const scenarioSample = scenarioFactory(id)(environment);
    merged = mergeVitalPair(merged, scenarioSample);
  }
  return {
    ...merged,
    missionDay: baseline.missionDay,
    environment,
    extraMetrics: {
      ...merged.extraMetrics,
      activeScenarios: active.join(","),
    },
  };
}