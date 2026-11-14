import type { MissionEnvironment, VitalReadings } from "@/types/health";

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hourUtc(iso: string): number {
  return new Date(iso).getUTCHours();
}

function appendMissionEvent(existing: string | undefined, code: string): string {
  const codes = new Set(
    (existing ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  codes.add(code);
  return [...codes].join(",");
}

/** Hourly dose rate (mSv/h) — peaks on solar-event days; sums ≈ daily total. */
function hourlyRadiationRate(dailyDose: number, missionDay: number, hour: number): number {
  const floor = 0.001;
  if (missionDay === 12 && hour >= 13 && hour <= 17) {
    const weight = hour === 14 || hour === 15 ? 0.28 : hour === 13 || hour === 16 ? 0.14 : 0.08;
    return Math.max(floor, dailyDose * weight);
  }
  return Math.max(floor, dailyDose / 24);
}

function vitalsForHour(daily: VitalReadings, hour: number): Pick<
  VitalReadings,
  | "systolicBP"
  | "diastolicBP"
  | "heartRate"
  | "bloodSugar"
  | "sleepHours"
  | "temperature"
  | "moodScore"
  | "stressLevel"
> {
  const sleepDebt = Math.max(0, 8 - daily.sleepHours);
  const isNight = hour >= 0 && hour < 6;
  const isMeal = hour === 8 || hour === 13 || hour === 20;
  const isExercise = hour === 10 || hour === 11;
  const isSolarPeak = daily.missionDay === 12 && hour >= 14 && hour <= 16;

  let heartRate = daily.heartRate;
  let systolic = daily.systolicBP;
  let glucose = daily.bloodSugar;
  let sleepHours = daily.sleepHours;

  if (isNight) {
    heartRate = Math.round(daily.heartRate - 8 - sleepDebt);
    systolic = Math.round(daily.systolicBP - 6);
    sleepHours = clamp(0, daily.sleepHours * (hour / 6), 24);
  } else if (isExercise) {
    heartRate = Math.round(daily.heartRate + 22);
    systolic = Math.round(daily.systolicBP + 12);
  } else if (isMeal) {
    glucose = Math.round(daily.bloodSugar + 8);
  }

  if (isSolarPeak) {
    heartRate = Math.round(heartRate + 8);
  }

  return {
    systolicBP: clamp(85, systolic, 200),
    diastolicBP: clamp(50, daily.diastolicBP + (isExercise ? 6 : 0), 130),
    heartRate: clamp(42, heartRate, 180),
    bloodSugar: clamp(70, glucose, 260),
    sleepHours: Math.round(sleepHours * 10) / 10,
    temperature: daily.temperature,
    moodScore: daily.moodScore,
    stressLevel: daily.stressLevel,
  };
}

/** 24 hourly samples for one mission day (UTC). */
export function buildHourlySamples(daily: VitalReadings): VitalReadings[] {
  const anchor = new Date(daily.recordedAt);
  const dayStart = new Date(
    Date.UTC(
      anchor.getUTCFullYear(),
      anchor.getUTCMonth(),
      anchor.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const dailyDose = daily.radiationMsv ?? 0;
  const samples: VitalReadings[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    const t = new Date(dayStart);
    t.setUTCHours(hour, 15, 0, 0);
    const vitals = vitalsForHour(daily, hour);
    const rate = hourlyRadiationRate(dailyDose, daily.missionDay, hour);

    samples.push({
      ...daily,
      recordedAt: t.toISOString(),
      ...vitals,
      radiationMsv: Math.round(rate * 1000) / 1000,
      extraMetrics: {
        ...daily.extraMetrics,
        intradaySlot: String(hour),
        radiationMsvDaily: dailyDose,
        sampleKind: "hour",
      },
    });
  }

  return samples;
}

/** 12 samples (5-minute steps) for one UTC hour within a mission day. */
export function buildMinuteSamplesForHour(
  daily: VitalReadings,
  hourUtc: number,
  slots = 12
): VitalReadings[] {
  const anchor = new Date(daily.recordedAt);
  const dayStart = new Date(
    Date.UTC(
      anchor.getUTCFullYear(),
      anchor.getUTCMonth(),
      anchor.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const baseHour = vitalsForHour(daily, hourUtc);
  const dailyDose = daily.radiationMsv ?? 0;
  const hourRate = hourlyRadiationRate(dailyDose, daily.missionDay, hourUtc);
  const samples: VitalReadings[] = [];
  const stepMin = Math.floor(60 / slots);

  for (let i = 0; i < slots; i += 1) {
    const t = new Date(dayStart);
    t.setUTCHours(hourUtc, i * stepMin, 30, 0);
    const micro = Math.sin((i / slots) * Math.PI) * 2;

    samples.push({
      ...daily,
      recordedAt: t.toISOString(),
      systolicBP: clamp(85, baseHour.systolicBP + Math.round(micro), 200),
      diastolicBP: baseHour.diastolicBP,
      heartRate: clamp(42, baseHour.heartRate + Math.round(micro * 2), 180),
      bloodSugar: baseHour.bloodSugar,
      sleepHours: baseHour.sleepHours,
      temperature: baseHour.temperature,
      moodScore: baseHour.moodScore,
      stressLevel: baseHour.stressLevel,
      radiationMsv: Math.round((hourRate / slots) * 10000) / 10000,
      extraMetrics: {
        ...daily.extraMetrics,
        intradaySlot: `${hourUtc}:${i}`,
        radiationMsvDaily: dailyDose,
        sampleKind: "minute",
        focusHourUtc: String(hourUtc),
      },
    });
  }

  return samples;
}

/** @deprecated Use buildHourlySamples — kept for DayReplayDetail compatibility */
export function buildIntradaySamples(daily: VitalReadings, slots = 24): VitalReadings[] {
  if (slots === 24) return buildHourlySamples(daily);
  return buildMinuteSamplesForHour(daily, hourUtc(daily.recordedAt), slots);
}

export function missionLogEventsForDay(
  missionDay: number,
  environment: MissionEnvironment
): string {
  const codes: string[] = ["routine_vitals", "habitat_air_check"];
  if (missionDay === 2) codes.push("hydration_protocol");
  if (missionDay === 4) codes.push("resistive_exercise_block");
  if (missionDay === 5) codes.push("eva_suit_prep");
  if (missionDay === 7) codes.push("autonomous_med_briefing");
  if (missionDay === 9) codes.push("resistive_exercise_block");
  if (missionDay === 10) codes.push("eva_suit_prep");
  if (missionDay === 12) codes.push("solar_particle_watch");
  if (missionDay === 13) codes.push("circadian_light_therapy", "cardio_alert");
  if (missionDay === 14) codes.push("ground_sync_window");
  if (environment === "rover" || environment === "lunar_base") {
    if (!codes.includes("eva_suit_prep")) codes.push("eva_suit_prep");
  }
  if (environment === "mars_base" || environment === "spacecraft") {
    if (!codes.includes("autonomous_med_briefing")) codes.push("autonomous_med_briefing");
  }
  return codes.join(",");
}

export function mergeScenarioMissionEvents(
  baseEvents: string | undefined,
  scenario: "solar" | "cardio" | "isolation"
): string {
  switch (scenario) {
    case "solar":
      return appendMissionEvent(baseEvents, "solar_particle_watch");
    case "cardio":
      return appendMissionEvent(baseEvents, "cardio_alert");
    case "isolation":
      return appendMissionEvent(baseEvents, "isolation_protocol");
  }
}