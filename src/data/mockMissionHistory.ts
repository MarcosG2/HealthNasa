import type { MissionEnvironment, VitalReadings } from "@/types/health";
import { missionLogEventsForDay } from "@/data/intradaySamples";

const baseDate = new Date("2026-11-01T00:00:00Z");

function entry(
  day: number,
  partial: Partial<VitalReadings> & Pick<VitalReadings, "environment">
): VitalReadings {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + day - 1);
  /** Stagger daily rollup time (hours:minutes:seconds UTC) per mission day. */
  d.setUTCHours(6 + (day % 12), (day * 7) % 60, (day * 11) % 60, 0);
  const env = partial.environment;
  return {
    missionDay: day,
    recordedAt: d.toISOString(),
    systolicBP: 118,
    diastolicBP: 76,
    heartRate: 72,
    bloodSugar: 98,
    temperature: 36.7,
    sleepHours: 7.2,
    moodScore: 4,
    stressLevel: 3,
    radiationMsv: 0.4 + day * 0.02,
    ...partial,
    environment: env,
    extraMetrics: {
      ...(partial.extraMetrics ?? {}),
      missionEvents: missionLogEventsForDay(day, env),
    },
  };
}

/** 14 mission days — subtle upward BP / downward sleep trend after day 9 */
export function buildMockMissionHistory(
  environment: MissionEnvironment = "station"
): VitalReadings[] {
  const env = environment;
  const days: VitalReadings[] = [];

  for (let day = 1; day <= 14; day++) {
    let systolic = 112 + Math.sin(day / 3) * 4;
    let diastolic = 74;
    let heartRate = 68 + (day % 3);
    let sleep = 7.4 - (day > 10 ? 0.15 * (day - 10) : 0);
    let mood = day > 11 ? 3 : 4;
    let glucose = 95 + (day > 8 ? (day - 8) * 2 : 0);
    let stress = day > 12 ? 5 : 3;

    if (day === 12) {
      systolic = 138;
      diastolic = 92;
      heartRate = 98;
    }
    if (day === 13) {
      sleep = 4.5;
      mood = 2;
      stress = 6;
    }
    if (day === 14) {
      systolic = 142;
      glucose = 165;
    }

    const envDoseBoost =
      env === "mars_base" ? 0.12 : env === "spacecraft" ? 0.08 : env === "rover" ? 0.05 : 0;
    const radiationMsv = day >= 14 ? 0.85 + envDoseBoost : 0.35 + day * 0.03 + envDoseBoost;

    days.push(
      entry(day, {
        environment: env,
        systolicBP: Math.round(systolic),
        diastolicBP: Math.round(diastolic),
        heartRate: Math.round(heartRate),
        bloodSugar: Math.round(glucose),
        temperature: 36.5 + (day === 13 ? 0.4 : 0.2),
        sleepHours: Math.round(sleep * 10) / 10,
        moodScore: mood,
        stressLevel: stress,
        radiationMsv,
      })
    );
  }

  return days;
}

export const MOCK_MISSION_HISTORY = buildMockMissionHistory("station");

function scenarioBase(environment: MissionEnvironment): VitalReadings {
  const last = buildMockMissionHistory(environment).slice(-1)[0];
  return {
    ...last,
    missionDay: (last?.missionDay ?? 14) + 1,
    recordedAt: new Date().toISOString(),
    environment,
  };
}

/** Solar Particle Event — high radiation, fatigue, elevated HR */
export function solarParticleScenario(
  environment: MissionEnvironment = "station"
): VitalReadings {
  const base = scenarioBase(environment);
  return {
    ...base,
    radiationMsv: 1.75,
    heartRate: 108,
    sleepHours: 5.2,
    moodScore: 3,
    stressLevel: 7,
    extraMetrics: { fatigueLevel: "elevated" },
  };
}

/** Cardio / microgravity dehydration — ground flight surgeon */
export function cardioDehydrationScenario(
  environment: MissionEnvironment = "station"
): VitalReadings {
  const base = scenarioBase(environment);
  return {
    ...base,
    systolicBP: 166,
    diastolicBP: 102,
    heartRate: 124,
    temperature: 38.3,
    bloodSugar: 118,
    stressLevel: 6,
    radiationMsv: 0.6,
  };
}

/** Isolation & circadian drift — crew attention */
export function isolationDriftScenario(
  environment: MissionEnvironment = "station"
): VitalReadings {
  const base = scenarioBase(environment);
  return {
    ...base,
    sleepHours: 3.8,
    moodScore: 2,
    stressLevel: 8,
    heartRate: 86,
    extraMetrics: { reactionTimeMs: 540 },
  };
}

/** @deprecated Use scenario helpers instead */
export const CRITICAL_SCENARIO_READING: VitalReadings = cardioDehydrationScenario("station");