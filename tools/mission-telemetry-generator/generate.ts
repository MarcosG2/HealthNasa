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

function buildDailyRow(
  config: GeneratorConfig,
  missionDay: number,
  aggregates: {
    heartRate: number;
    systolic: number;
    diastolic: number;
    glucose: number;
    temp: number;
    maxHr: number;
  }
): VitalReadings {
  const d = new Date(config.missionStartIso);
  d.setUTCDate(d.getUTCDate() + missionDay - 1);
  d.setUTCHours(6 + (missionDay % 12), (missionDay * 7) % 60, 0, 0);

  const sleep =
    missionDay === 15
      ? 5.2
      : 7.1 - (missionDay > 22 ? 0.08 * (missionDay - 22) : 0);
  const stress = aggregates.maxHr > 155 ? 7 : missionDay > 20 ? 5 : 3;

  return {
    missionDay,
    recordedAt: d.toISOString(),
    environment: config.environment,
    systolicBP: aggregates.systolic,
    diastolicBP: aggregates.diastolic,
    heartRate: aggregates.heartRate,
    bloodSugar: aggregates.glucose,
    temperature: aggregates.temp,
    sleepHours: Math.round(sleep * 10) / 10,
    moodScore: stress > 6 ? 2 : 4,
    stressLevel: stress,
    radiationMsv: Math.round((0.35 + missionDay * 0.018) * 1000) / 1000,
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

    const row: TelemetryHotSample = {
      recordedAt: date.toISOString(),
      missionDay,
      ...vitals,
    };
    allSamples.push(row);

    const acc = dailyAcc.get(missionDay) ?? {
      hrSum: 0,
      sysSum: 0,
      diaSum: 0,
      gluSum: 0,
      tempSum: 0,
      maxHr: 0,
      count: 0,
    };
    acc.hrSum += vitals.heartRate;
    acc.sysSum += vitals.systolicBP;
    acc.diaSum += vitals.diastolicBP;
    acc.gluSum += vitals.bloodSugar;
    acc.tempSum += vitals.temperature;
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
      buildDailyRow(config, day, {
        heartRate: Math.round(acc.hrSum / acc.count),
        systolic: Math.round(acc.sysSum / acc.count),
        diastolic: Math.round(acc.diaSum / acc.count),
        glucose: Math.round(acc.gluSum / acc.count),
        temp: Math.round((acc.tempSum / acc.count) * 10) / 10,
        maxHr: acc.maxHr,
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