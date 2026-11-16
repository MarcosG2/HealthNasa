import type {
  AstronautHealthArchetype,
  MissionScenarioId,
  MissionTelemetryArchive,
  TelemetryHotSample,
  TelemetryRollupBucket,
  VitalReadings,
} from "@/types/health";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function missionProgress(missionDay: number, totalDays: number): number {
  if (totalDays <= 1) return 1;
  return clamp((missionDay - 1) / (totalDays - 1), 0, 1);
}

interface ArchetypeCoefficients {
  heartRateOffset: (t: number) => number;
  heartRateScale: (t: number) => number;
  heartRateBandWiden: (t: number) => number;
  systolicOffset: (t: number) => number;
  diastolicOffset: (t: number) => number;
  bloodSugarOffset: (t: number) => number;
  temperatureOffset: (t: number) => number;
  sleepHoursScale: (t: number) => number;
  moodDelta: (t: number) => number;
  stressOffset: (t: number) => number;
  radiationScale: (t: number) => number;
}

const COEFFICIENTS: Record<AstronautHealthArchetype, ArchetypeCoefficients> = {
  healthy: {
    heartRateOffset: () => -3,
    heartRateScale: () => 0.97,
    heartRateBandWiden: () => 0,
    systolicOffset: () => -4,
    diastolicOffset: () => -2,
    bloodSugarOffset: () => -4,
    temperatureOffset: () => -0.05,
    sleepHoursScale: () => 1.02,
    moodDelta: () => 0.3,
    stressOffset: () => -1.5,
    radiationScale: () => 0.92,
  },
  cardio_warning: {
    heartRateOffset: (t) => 6 + 24 * t,
    heartRateScale: (t) => 1 + 0.06 * t,
    heartRateBandWiden: (t) => 0.12 + 0.18 * t,
    systolicOffset: (t) => 8 + 26 * t,
    diastolicOffset: (t) => 5 + 14 * t,
    bloodSugarOffset: (t) => 4 + 8 * t,
    temperatureOffset: (t) => 0.05 + 0.08 * t,
    sleepHoursScale: () => 0.96,
    moodDelta: (t) => -0.5 - 0.8 * t,
    stressOffset: (t) => 1 + 2 * t,
    radiationScale: () => 1,
  },
  radiation_exposure: {
    heartRateOffset: (t) => 4 + 10 * t,
    heartRateScale: (t) => 1 + 0.04 * t,
    heartRateBandWiden: (t) => 0.08 + 0.1 * t,
    systolicOffset: (t) => 3 + 6 * t,
    diastolicOffset: (t) => 2 + 4 * t,
    bloodSugarOffset: (t) => 6 + 10 * t,
    temperatureOffset: (t) => 0.08,
    sleepHoursScale: (t) => 1 - 0.08 * t,
    moodDelta: (t) => -0.6 - 1.2 * t,
    stressOffset: (t) => 2 + 3 * t,
    radiationScale: (t) => 1.25 + 0.75 * t,
  },
  isolation_stress: {
    heartRateOffset: (t) => 2 + 8 * t,
    heartRateScale: (t) => 1 + 0.05 * t,
    heartRateBandWiden: (t) => 0.1 * t,
    systolicOffset: (t) => 4 + 8 * t,
    diastolicOffset: (t) => 2 + 5 * t,
    bloodSugarOffset: (t) => 5 + 12 * t,
    temperatureOffset: () => 0.04,
    sleepHoursScale: (t) => 0.82 - 0.12 * t,
    moodDelta: (t) => -1.2 - 2.2 * t,
    stressOffset: (t) => 3 + 5 * t,
    radiationScale: () => 1.02,
  },
  metabolic_drift: {
    heartRateOffset: (t) => 2 + 6 * t,
    heartRateScale: (t) => 1 + 0.03 * t,
    heartRateBandWiden: (t) => 0.06 * t,
    systolicOffset: (t) => 5 + 10 * t,
    diastolicOffset: (t) => 3 + 6 * t,
    bloodSugarOffset: (t) => 12 + 42 * t,
    temperatureOffset: (t) => 0.08 + 0.22 * t,
    sleepHoursScale: (t) => 0.94 - 0.06 * t,
    moodDelta: (t) => -0.4 - 0.9 * t,
    stressOffset: (t) => 1 + 2.5 * t,
    radiationScale: () => 1,
  },
  multi_system_critical: {
    heartRateOffset: (t) => 10 + 28 * t,
    heartRateScale: (t) => 1 + 0.1 * t,
    heartRateBandWiden: (t) => 0.15 + 0.22 * t,
    systolicOffset: (t) => 14 + 32 * t,
    diastolicOffset: (t) => 8 + 18 * t,
    bloodSugarOffset: (t) => 18 + 38 * t,
    temperatureOffset: (t) => 0.12 + 0.28 * t,
    sleepHoursScale: (t) => 0.72 - 0.1 * t,
    moodDelta: (t) => -2 - 2.5 * t,
    stressOffset: (t) => 4 + 5 * t,
    radiationScale: (t) => 1.35 + 0.85 * t,
  },
};

function transformHeartRateFields(
  heartRate: number,
  heartRateMin: number | undefined,
  heartRateMax: number | undefined,
  coeffs: ArchetypeCoefficients,
  t: number
): { heartRate: number; min?: number; max?: number } {
  const hr = clamp(
    Math.round(heartRate * coeffs.heartRateScale(t) + coeffs.heartRateOffset(t)),
    42,
    185
  );
  const widen = 1 + coeffs.heartRateBandWiden(t);
  const min =
    heartRateMin !== undefined
      ? clamp(Math.round((heartRateMin + coeffs.heartRateOffset(t) * 0.35) * widen), 40, hr)
      : undefined;
  const max =
    heartRateMax !== undefined
      ? clamp(Math.round((heartRateMax + coeffs.heartRateOffset(t) * 0.85) * widen), hr, 190)
      : undefined;
  return { heartRate: hr, min, max };
}

function applyCoefficientsToVital(
  row: VitalReadings,
  archetype: AstronautHealthArchetype,
  totalDays: number,
  typicalScenarios: MissionScenarioId[]
): VitalReadings {
  const coeffs = COEFFICIENTS[archetype];
  const t = missionProgress(row.missionDay, totalDays);

  const minRaw = row.extraMetrics?.heartRateMin;
  const maxRaw = row.extraMetrics?.heartRateMax;
  const hrMin = typeof minRaw === "string" ? Number(minRaw) : undefined;
  const hrMax = typeof maxRaw === "string" ? Number(maxRaw) : undefined;
  const { heartRate, min, max } = transformHeartRateFields(
    row.heartRate,
    hrMin,
    hrMax,
    coeffs,
    t
  );

  const radiationBase = row.radiationMsv ?? 0.04;
  const stressBase = row.stressLevel ?? 3;

  return {
    ...row,
    heartRate,
    systolicBP: clamp(Math.round(row.systolicBP + coeffs.systolicOffset(t)), 85, 190),
    diastolicBP: clamp(Math.round(row.diastolicBP + coeffs.diastolicOffset(t)), 50, 120),
    bloodSugar: clamp(Math.round(row.bloodSugar + coeffs.bloodSugarOffset(t)), 70, 220),
    temperature: round1(row.temperature + coeffs.temperatureOffset(t)),
    sleepHours: round1(clamp(row.sleepHours * coeffs.sleepHoursScale(t), 2.5, 10)),
    moodScore: clamp(Math.round(row.moodScore + coeffs.moodDelta(t)), 1, 5),
    stressLevel: clamp(Math.round(stressBase + coeffs.stressOffset(t)), 1, 10),
    radiationMsv: round1(radiationBase * coeffs.radiationScale(t)),
    extraMetrics: {
      ...row.extraMetrics,
      rosterArchetype: archetype,
      typicalScenarios: typicalScenarios.join(","),
      archetypeTransform: "view-layer",
      ...(min !== undefined ? { heartRateMin: String(min) } : {}),
      ...(max !== undefined ? { heartRateMax: String(max) } : {}),
    },
  };
}

/** Progressive archetype shaping for daily vitals (short or long series). */
export function applyArchetypeToVitalSeries(
  telemetry: VitalReadings[],
  archetype: AstronautHealthArchetype,
  typicalScenarios: MissionScenarioId[] = []
): VitalReadings[] {
  if (telemetry.length === 0) return telemetry;
  const totalDays = Math.max(...telemetry.map((r) => r.missionDay));
  return telemetry.map((row) =>
    applyCoefficientsToVital(row, archetype, totalDays, typicalScenarios)
  );
}

function transformHotSample(
  sample: TelemetryHotSample,
  archetype: AstronautHealthArchetype,
  totalDays: number
): TelemetryHotSample {
  const coeffs = COEFFICIENTS[archetype];
  const t = missionProgress(sample.missionDay, totalDays);
  const { heartRate } = transformHeartRateFields(
    sample.heartRate,
    undefined,
    undefined,
    coeffs,
    t
  );
  return {
    ...sample,
    heartRate,
    systolicBP: clamp(Math.round(sample.systolicBP + coeffs.systolicOffset(t)), 85, 190),
    diastolicBP: clamp(Math.round(sample.diastolicBP + coeffs.diastolicOffset(t)), 50, 120),
    bloodSugar: clamp(Math.round(sample.bloodSugar + coeffs.bloodSugarOffset(t)), 70, 220),
    temperature: round1(sample.temperature + coeffs.temperatureOffset(t)),
    stressLevel:
      sample.stressLevel !== undefined
        ? clamp(Math.round(sample.stressLevel + coeffs.stressOffset(t)), 1, 10)
        : undefined,
    moodScore:
      sample.moodScore !== undefined
        ? clamp(Math.round(sample.moodScore + coeffs.moodDelta(t)), 1, 5)
        : undefined,
    radiationMsv:
      sample.radiationMsv !== undefined
        ? round1(sample.radiationMsv * coeffs.radiationScale(t))
        : undefined,
  };
}

function transformRollupBucket(
  bucket: TelemetryRollupBucket,
  archetype: AstronautHealthArchetype,
  totalDays: number
): TelemetryRollupBucket {
  const coeffs = COEFFICIENTS[archetype];
  const t = missionProgress(bucket.missionDay, totalDays);
  const { heartRate, min, max } = transformHeartRateFields(
    bucket.heartRateAvg,
    bucket.heartRateMin,
    bucket.heartRateMax,
    coeffs,
    t
  );
  return {
    ...bucket,
    heartRateAvg: heartRate,
    heartRateMin: min ?? bucket.heartRateMin,
    heartRateMax: max ?? bucket.heartRateMax,
    systolicAvg: clamp(Math.round(bucket.systolicAvg + coeffs.systolicOffset(t)), 85, 190),
    bloodSugarAvg:
      bucket.bloodSugarAvg !== undefined
        ? clamp(Math.round(bucket.bloodSugarAvg + coeffs.bloodSugarOffset(t)), 70, 220)
        : undefined,
    temperatureAvg:
      bucket.temperatureAvg !== undefined
        ? round1(bucket.temperatureAvg + coeffs.temperatureOffset(t))
        : undefined,
    radiationDose:
      bucket.radiationDose !== undefined
        ? round1(bucket.radiationDose * coeffs.radiationScale(t))
        : undefined,
    stressAvg:
      bucket.stressAvg !== undefined
        ? clamp(Math.round(bucket.stressAvg + coeffs.stressOffset(t)), 1, 10)
        : undefined,
    moodAvg:
      bucket.moodAvg !== undefined
        ? clamp(Math.round(bucket.moodAvg + coeffs.moodDelta(t)), 1, 5)
        : undefined,
  };
}

/**
 * Non-destructive view of the layered 30-day archive — base JSON stays on disk unchanged.
 */
export function applyArchetypeToMissionArchive(
  archive: MissionTelemetryArchive,
  archetype: AstronautHealthArchetype,
  typicalScenarios: MissionScenarioId[] = []
): MissionTelemetryArchive {
  const totalDays = archive.meta.missionDays || archive.daily.length;
  return {
    ...archive,
    meta: { ...archive.meta, astronautId: undefined },
    daily: applyArchetypeToVitalSeries(archive.daily, archetype, typicalScenarios),
    hot: archive.hot.map((s) => transformHotSample(s, archetype, totalDays)),
    rollups: {
      minute: archive.rollups.minute.map((b) =>
        transformRollupBucket(b, archetype, totalDays)
      ),
      hour: archive.rollups.hour.map((b) => transformRollupBucket(b, archetype, totalDays)),
    },
  };
}