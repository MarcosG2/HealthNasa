import type { MissionEnvironment, VitalReadings } from "@/types/health";

const baseDate = new Date("2026-11-01T08:00:00Z");

function entry(
  day: number,
  partial: Partial<VitalReadings> & Pick<VitalReadings, "environment">
): VitalReadings {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + day - 1);
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
    radiationMsv: 0.4 + day * 0.02,
    ...partial,
    environment: partial.environment,
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

    if (day === 12) {
      systolic = 138;
      diastolic = 92;
      heartRate = 98;
    }
    if (day === 13) {
      sleep = 4.5;
      mood = 2;
    }
    if (day === 14) {
      systolic = 142;
      glucose = 165;
    }

    const radiationMsv = day >= 14 ? 0.85 : 0.35 + day * 0.03;

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
        radiationMsv,
      })
    );
  }

  return days;
}

export const MOCK_MISSION_HISTORY = buildMockMissionHistory("station");

export const CRITICAL_SCENARIO_READING: VitalReadings = {
  missionDay: 15,
  recordedAt: new Date().toISOString(),
  environment: "station",
  systolicBP: 168,
  diastolicBP: 104,
  heartRate: 124,
  bloodSugar: 210,
  temperature: 38.4,
  sleepHours: 3.5,
  moodScore: 1,
  radiationMsv: 1.2,
  extraMetrics: { headache: "severe" },
};