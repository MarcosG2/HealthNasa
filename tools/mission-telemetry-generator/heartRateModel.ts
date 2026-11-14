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

export interface VitalsTick {
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number;
  temperature: number;
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

  let heartRate = sleeping
    ? 65 + rand() * 10
    : 80 + rand() * 15;

  if (exercising) {
    heartRate = 120 + rand() * 30;
  }

  for (const anomaly of config.anomalies) {
    const { active, phase } = isInAnomaly(anomaly, missionDay, hour, minute);
    if (!active) continue;
    const spike = anomaly.peakHeartRate + rand() * 12;
    const wobble = Math.sin(phase * Math.PI * 6) * 18 + (rand() - 0.5) * 22;
    heartRate = Math.max(spike - 8, spike + wobble);
    if (phase > 0.35 && rand() > 0.55) {
      heartRate = 142 + rand() * 25;
    }
  }

  heartRate = Math.round(clamp(42, heartRate, 185));

  const baseBp = sleeping ? [108, 70] : [118, 76];
  const bpBoost = exercising ? 14 : 0;
  const anomalyBp = config.anomalies.some((a) => isInAnomaly(a, missionDay, hour, minute).active)
    ? 22
    : 0;

  return {
    heartRate,
    systolicBP: Math.round(clamp(85, baseBp[0] + bpBoost + anomalyBp + rand() * 4, 200)),
    diastolicBP: Math.round(clamp(50, baseBp[1] + bpBoost / 2 + rand() * 3, 130)),
    bloodSugar: Math.round(clamp(70, 96 + (exercising ? -6 : 0) + rand() * 12, 180)),
    temperature: Math.round((36.5 + rand() * 0.6 + (exercising ? 0.15 : 0)) * 10) / 10,
  };
}

export function createVitalsRandom(config: GeneratorConfig): () => number {
  return mulberry32(seedFromString(`${config.seed}:${config.missionDays}`));
}