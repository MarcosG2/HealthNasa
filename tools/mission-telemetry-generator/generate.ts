import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { missionLogEventsForDay } from "../../src/data/intradaySamples";
import type {
  MissionTelemetryArchive,
  TelemetryHotSample,
  VitalReadings,
} from "../../src/types/health";
import type { GeneratorConfig } from "./config";
import { createVitalsRandom, sampleVitalsAt } from "./heartRateModel";
import { buildRollups } from "./rollup";

function missionDayAt(startMs: number, tsMs: number): number {
  const dayIndex = Math.floor((tsMs - startMs) / 86_400_000);
  return dayIndex + 1;
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildDailyRow(
  config: GeneratorConfig,
  missionDay: number,
  rand: () => number,
  aggregates: {
    heartRate: number;
    systolic: number;
    diastolic: number;
    glucose: number;
    temp: number;
    maxHr: number;
    totalRadiationDose: number;
    avgStress: number;
    avgMood: number;
  }
): VitalReadings {
  const d = new Date(config.missionStartIso);
  d.setUTCDate(d.getUTCDate() + missionDay - 1);
  d.setUTCHours(6 + (missionDay % 12), (missionDay * 7) % 60, 0, 0);

  // Realistic astronaut sleep duration modeling
  let sleep = 7.2 + (rand() - 0.5) * 0.8;
  if (missionDay > 25) {
    sleep -= (missionDay - 25) * 0.015; // Gradual microgravity sleep fragmentation
  }

  // Check specific anomalies affecting sleep
  const hasCardioAlert = config.anomalies.some(
    (a) => a.missionDay === missionDay && a.label === "cardio_alert"
  );
  const hasSolarEvent = config.anomalies.some(
    (a) => a.missionDay === missionDay && a.label === "solar_particle_event"
  );
  const hasInsomnia = config.anomalies.some(
    (a) => a.missionDay === missionDay && a.label === "isolation_insomnia"
  );

  if (hasCardioAlert) {
    sleep = 5.1;
  } else if (hasSolarEvent) {
    sleep = 5.6;
  } else if (hasInsomnia) {
    sleep = 4.7;
  }
  sleep = Math.round(clamp(4.2, sleep, 8.5) * 10) / 10;

  // Daily representative stress (1-10)
  let stress = aggregates.avgStress;
  if (sleep < 5.8) stress += 1.8;
  if (aggregates.maxHr > 155) stress += 2.2;
  if (hasSolarEvent) stress += 2.5;
  if (hasInsomnia) stress += 2.0;
  const stressLevel = Math.round(clamp(1, stress, 10));

  // Daily representative mood (1-5)
  let mood = 4;
  if (stressLevel >= 8) {
    mood = 1;
  } else if (stressLevel >= 6) {
    mood = 2;
  } else if (stressLevel >= 4 || sleep < 6.0) {
    mood = 3;
  } else if (sleep >= 7.2 && aggregates.maxHr < 145) {
    mood = 5;
  }

  // Daily accumulated radiation dose (mSv)
  const radiationMsv = Math.round(aggregates.totalRadiationDose * 1000) / 1000;

  return {
    missionDay,
    recordedAt: d.toISOString(),
    environment: config.environment,
    systolicBP: aggregates.systolic,
    diastolicBP: aggregates.diastolic,
    heartRate: aggregates.heartRate,
    bloodSugar: aggregates.glucose,
    temperature: aggregates.temp,
    sleepHours: sleep,
    moodScore: mood,
    stressLevel,
    radiationMsv,
    extraMetrics: {
      missionEvents: missionLogEventsForDay(missionDay, config.environment),
      ...(config.astronautId ? { astronautId: config.astronautId } : {}),
      dailyMaxHeartRate: String(aggregates.maxHr),
      telemetrySource: "generator",
    },
  };
}

export function generateMissionTelemetry(
  config: GeneratorConfig,
  repoRoot: string
): MissionTelemetryArchive {
  const rand = createVitalsRandom(config);
  const startMs = new Date(config.missionStartIso).getTime();
  const intervalMs = config.sampleIntervalSec * 1000;
  const tickHours = config.sampleIntervalSec / 3600;
  const totalTicks = Math.floor(
    (config.missionDays * 86_400_000) / intervalMs
  );

  const allSamples: TelemetryHotSample[] = [];
  const dailyAcc = new Map<
    number,
    {
      hrSum: number;
      sysSum: number;
      diaSum: number;
      gluSum: number;
      tempSum: number;
      radDoseSum: number;
      stressSum: number;
      moodSum: number;
      maxHr: number;
      count: number;
    }
  >();

  for (let i = 0; i < totalTicks; i += 1) {
    const ts = startMs + i * intervalMs;
    const date = new Date(ts);
    const missionDay = missionDayAt(startMs, ts);
    const vitals = sampleVitalsAt(
      config,
      rand,
      missionDay,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );

    const tickDose = vitals.radiationRateHourly * tickHours;

    const row: TelemetryHotSample = {
      recordedAt: date.toISOString(),
      missionDay,
      heartRate: vitals.heartRate,
      systolicBP: vitals.systolicBP,
      diastolicBP: vitals.diastolicBP,
      bloodSugar: vitals.bloodSugar,
      temperature: vitals.temperature,
      radiationMsv: Math.round(vitals.radiationRateHourly * 1000) / 1000,
      stressLevel: vitals.stressLevel,
      moodScore: vitals.moodScore,
    };
    allSamples.push(row);

    const acc = dailyAcc.get(missionDay) ?? {
      hrSum: 0,
      sysSum: 0,
      diaSum: 0,
      gluSum: 0,
      tempSum: 0,
      radDoseSum: 0,
      stressSum: 0,
      moodSum: 0,
      maxHr: 0,
      count: 0,
    };
    acc.hrSum += vitals.heartRate;
    acc.sysSum += vitals.systolicBP;
    acc.diaSum += vitals.diastolicBP;
    acc.gluSum += vitals.bloodSugar;
    acc.tempSum += vitals.temperature;
    acc.radDoseSum += tickDose;
    acc.stressSum += vitals.stressLevel;
    acc.moodSum += vitals.moodScore;
    acc.maxHr = Math.max(acc.maxHr, vitals.heartRate);
    acc.count += 1;
    dailyAcc.set(missionDay, acc);
  }

  const hotCutoff = allSamples[allSamples.length - 1].recordedAt;
  const hotStartMs =
    new Date(hotCutoff).getTime() - config.hotWindowHours * 3_600_000;
  const hot = allSamples.filter((s) => new Date(s.recordedAt).getTime() >= hotStartMs);

  const rollups = buildRollups(hot, allSamples);

  const daily: VitalReadings[] = [];
  for (let day = 1; day <= config.missionDays; day += 1) {
    const acc = dailyAcc.get(day);
    if (!acc) continue;
    daily.push(
      buildDailyRow(config, day, rand, {
        heartRate: Math.round(acc.hrSum / acc.count),
        systolic: Math.round(acc.sysSum / acc.count),
        diastolic: Math.round(acc.diaSum / acc.count),
        glucose: Math.round(acc.gluSum / acc.count),
        temp: Math.round((acc.tempSum / acc.count) * 10) / 10,
        maxHr: acc.maxHr,
        totalRadiationDose: acc.radDoseSum,
        avgStress: acc.stressSum / acc.count,
        avgMood: acc.moodSum / acc.count,
      })
    );
  }

  const archive: MissionTelemetryArchive = {
    meta: {
      version: 1,
      missionDays: config.missionDays,
      sampleIntervalSec: config.sampleIntervalSec,
      hotWindowHours: config.hotWindowHours,
      generatedAt: new Date().toISOString(),
      missionStartIso: config.missionStartIso,
      astronautId: config.astronautId,
      environment: config.environment,
      seed: config.seed,
    },
    daily,
    anomalies: config.anomalies,
    hot,
    rollups,
  };

  const outFile = resolve(repoRoot, config.outputPath);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(archive));

  return archive;
}
