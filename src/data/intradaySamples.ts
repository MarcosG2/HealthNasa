import type { MissionEnvironment, VitalReadings } from "@/types/health";

/** Generate hourly (or sub-hour) samples for replay drill-down on a selected mission day. */
export function buildIntradaySamples(
  daily: VitalReadings,
  slots = 24
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

  const samples: VitalReadings[] = [];
  const minutesPerSlot = Math.floor((24 * 60) / slots);

  for (let i = 0; i < slots; i += 1) {
    const t = new Date(dayStart);
    t.setUTCMinutes(t.getUTCMinutes() + i * minutesPerSlot);
    t.setUTCSeconds(15 + (i % 45));

    const phase = i / slots;
    const wobble = Math.sin(phase * Math.PI * 2);
    const micro = Math.cos(phase * Math.PI * 4) * 0.5;

    samples.push({
      ...daily,
      recordedAt: t.toISOString(),
      systolicBP: Math.round(daily.systolicBP + wobble * 4 + micro),
      diastolicBP: Math.round(daily.diastolicBP + wobble * 2),
      heartRate: Math.round(daily.heartRate + wobble * 5 + (i % 3)),
      bloodSugar: Math.round(daily.bloodSugar + wobble * 6),
      temperature: Math.round((daily.temperature + micro * 0.15) * 10) / 10,
      sleepHours: Math.max(
        0,
        Math.round((daily.sleepHours * (0.92 + phase * 0.08) + micro) * 10) / 10
      ),
      radiationMsv:
        daily.radiationMsv !== undefined
          ? Math.round((daily.radiationMsv / slots + wobble * 0.02) * 1000) / 1000
          : undefined,
      moodScore: Math.min(
        5,
        Math.max(1, daily.moodScore + (wobble > 0.6 ? 1 : wobble < -0.6 ? -1 : 0))
      ),
      stressLevel:
        daily.stressLevel !== undefined
          ? Math.min(10, Math.max(1, Math.round(daily.stressLevel + wobble * 1.5)))
          : undefined,
      extraMetrics: {
        ...daily.extraMetrics,
        intradaySlot: String(i),
      },
    });
  }

  return samples;
}

export function missionLogEventsForDay(
  missionDay: number,
  environment: MissionEnvironment
): string {
  const codes: string[] = ["routine_vitals", "habitat_air_check"];
  if (missionDay % 3 === 0) codes.push("resistive_exercise_block");
  if (missionDay % 5 === 0) codes.push("hydration_protocol");
  if (missionDay === 12) codes.push("solar_particle_watch");
  if (missionDay === 13) codes.push("circadian_light_therapy");
  if (missionDay === 14) codes.push("ground_sync_window");
  if (environment === "rover" || environment === "lunar_base") {
    codes.push("eva_suit_prep");
  }
  if (environment === "mars_base" || environment === "spacecraft") {
    codes.push("autonomous_med_briefing");
  }
  return codes.join(",");
}