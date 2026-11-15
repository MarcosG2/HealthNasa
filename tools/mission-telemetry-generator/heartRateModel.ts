import type { GeneratorConfig } from "./config";
import type { TelemetryAnomalySpec } from "../../src/types/health";
import { mulberry32, seedFromString } from "./rng";

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isInSleep(hour: number, start: number, end: number): boolean {
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function minutesSinceMidnight(hour: number, minute: number, second: number): number {
  return hour * 60 + minute + second / 60;
}

function isInActivity(
  config: GeneratorConfig,
  hour: number,
  minute: number,
  second: number
): boolean {
  const t = minutesSinceMidnight(hour, minute, second);
  for (const block of config.activityBlocksUtc) {
    const start = block.startHour * 60 + block.startMinute;
    const end = start + block.durationMin;
    if (t >= start && t < end) return true;
  }
  return false;
}

function isInAnomaly(
  anomaly: TelemetryAnomalySpec,
  missionDay: number,
  hour: number,
  minute: number
): { active: boolean; phase: number } {
  if (anomaly.missionDay !== missionDay) return { active: false, phase: 0 };
  const start = anomaly.utcHour * 60 + anomaly.utcMinute;
  const end = start + anomaly.durationMinutes;
  const now = hour * 60 + minute;
  if (now < start || now >= end) return { active: false, phase: 0 };
  return { active: true, phase: (now - start) / Math.max(1, anomaly.durationMinutes) };
}

function baseHourlyRadiationForEnvironment(env: GeneratorConfig["environment"]): number {
  switch (env) {
    case "station":
      return 0.020; // ~0.48 mSv/day (LEO, Earth magnetic shielding)
    case "lunar_base":
      return 0.038; // ~0.91 mSv/day (Lunar surface)
    case "rover":
      return 0.045; // ~1.08 mSv/day (EVA surface)
    case "spacecraft":
    case "mars_base":
      return 0.058; // ~1.40 mSv/day (Deep space / Mars cosmic rays)
    default:
      return 0.020;
  }
}

function postprandialGlucoseBoost(hour: number, minute: number): number {
  // Scheduled nutrition: 08:00 (Breakfast), 13:00 (Lunch), 20:00 (Dinner)
  const mealMinutes = [8 * 60, 13 * 60, 20 * 60];
  const now = hour * 60 + minute;
  let maxBoost = 0;
  for (const meal of mealMinutes) {
    const elapsed = now - meal;
    if (elapsed >= 0 && elapsed <= 120) {
      const boost = 30 * Math.exp(-Math.pow((elapsed - 35) / 28, 2));
      if (boost > maxBoost) maxBoost = boost;
    }
  }
  return maxBoost;
}

function circadianBodyTemp(hour: number, minute: number): number {
  // Circadian nadir at ~04:00 UTC, peak at ~16:30 UTC
  const hourFrac = hour + minute / 60;
  const tempOffset = 0.28 * Math.cos(((hourFrac - 16.5) / 24) * 2 * Math.PI);
  return 36.6 + tempOffset;
}

export interface VitalsTick {
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number;
  temperature: number;
  radiationRateHourly: number;
  stressLevel: number;
  moodScore: number;
}

export function sampleVitalsAt(
  config: GeneratorConfig,
  rand: () => number,
  missionDay: number,
  hour: number,
  minute: number,
  second: number
): VitalsTick {
  const sleeping = isInSleep(hour, config.sleepUtc.startHour, config.sleepUtc.endHour);
  const exercising = isInActivity(config, hour, minute, second);

  // 1. Heart Rate
  let heartRate = sleeping
    ? 65 + rand() * 10
    : 80 + rand() * 15;

  if (exercising) {
    heartRate = 122 + rand() * 28;
  }

  // 2. Radiation Rate
  let radiationRateHourly =
    baseHourlyRadiationForEnvironment(config.environment) + (rand() - 0.5) * 0.003;

  // 3. Stress & Mood
  let stress = sleeping ? 1.5 : 2.5 + rand() * 0.8;
  if (exercising) stress += 1.5;
  if (missionDay > 20) {
    stress += (missionDay - 20) * 0.035; // Chronic isolation drift
  }

  // 4. Check Anomalies
  for (const anomaly of config.anomalies) {
    const { active, phase } = isInAnomaly(anomaly, missionDay, hour, minute);
    if (!active) continue;

    if (anomaly.peakHeartRate) {
      const spike = anomaly.peakHeartRate + rand() * 10;
      const wobble = Math.sin(phase * Math.PI * 6) * 16 + (rand() - 0.5) * 18;
      heartRate = Math.max(spike - 8, spike + wobble);
      if (phase > 0.35 && rand() > 0.55) {
        heartRate = 142 + rand() * 22;
      }
    }

    if (anomaly.peakRadiationMsvHourly) {
      const surge = anomaly.peakRadiationMsvHourly * Math.sin(phase * Math.PI);
      radiationRateHourly = Math.max(radiationRateHourly, surge + (rand() - 0.5) * 0.015);
    }

    if (anomaly.stressLevelBoost) {
      stress += anomaly.stressLevelBoost;
    }
  }

  heartRate = Math.round(clamp(42, heartRate, 185));
  radiationRateHourly = Math.max(0.001, Math.round(radiationRateHourly * 1000) / 1000);

  // 5. Blood Pressure
  const baseBp = sleeping ? [108, 68] : [118, 76];
  const bpBoost = exercising ? 16 : 0;
  const isAnyAnomaly = config.anomalies.some(
    (a) => isInAnomaly(a, missionDay, hour, minute).active
  );
  const anomalyBp = isAnyAnomaly ? 18 : 0;
  const systolicBP = Math.round(clamp(85, baseBp[0] + bpBoost + anomalyBp + rand() * 5, 200));
  const diastolicBP = Math.round(clamp(50, baseBp[1] + bpBoost / 2 + (isAnyAnomaly ? 8 : 0) + rand() * 4, 130));

  // 6. Blood Sugar (Circadian meals + exercise consumption)
  const fastingBase = sleeping ? 88 : 94;
  const mealBoost = postprandialGlucoseBoost(hour, minute);
  const exerciseSugarDrop = exercising ? -8 : 0;
  const stressSugarBoost = stress > 6 ? 6 : 0;
  const bloodSugar = Math.round(
    clamp(70, fastingBase + mealBoost + exerciseSugarDrop + stressSugarBoost + (rand() - 0.5) * 6, 220)
  );

  // 7. Core Body Temperature
  const circadianTemp = circadianBodyTemp(hour, minute);
  const exerciseTemp = exercising ? 0.3 : 0;
  const temperature = Math.round((circadianTemp + exerciseTemp + (rand() - 0.5) * 0.15) * 10) / 10;

  // 8. Mood & Final Stress
  const stressLevel = Math.round(clamp(1, stress, 10));
  let mood = 4.2;
  if (stressLevel >= 7) mood = 2;
  else if (stressLevel >= 5) mood = 3;
  else if (sleeping) mood = 4.5;
  else mood = 4.0 + (rand() > 0.6 ? 1 : 0);
  const moodScore = Math.round(clamp(1, mood, 5));

  return {
    heartRate,
    systolicBP,
    diastolicBP,
    bloodSugar,
    temperature,
    radiationRateHourly,
    stressLevel,
    moodScore,
  };
}

export function createVitalsRandom(config: GeneratorConfig): () => number {
  return mulberry32(seedFromString(`${config.seed}:${config.missionDays}`));
}
