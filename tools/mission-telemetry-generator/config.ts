import type { MissionEnvironment, TelemetryAnomalySpec } from "../../src/types/health";

export interface GeneratorConfig {
  missionDays: number;
  sampleIntervalSec: number;
  hotWindowHours: number;
  missionStartIso: string;
  environment: MissionEnvironment;
  astronautId?: string;
  seed: string;
  sleepUtc: { startHour: 22; endHour: 6 };
  activityBlocksUtc: Array<{ startHour: number; startMinute: number; durationMin: number }>;
  anomalies: TelemetryAnomalySpec[];
  outputPath: string;
}

export const DEFAULT_CONFIG: GeneratorConfig = {
  missionDays: 60,
  sampleIntervalSec: 5,
  hotWindowHours: 24,
  missionStartIso: "2026-11-01T00:00:00.000Z",
  environment: "station",
  astronautId: "eva-chen",
  seed: "nasa-pmv-telemetry-v1",
  sleepUtc: { startHour: 22, endHour: 6 },
  activityBlocksUtc: [
    { startHour: 10, startMinute: 0, durationMin: 45 },
    { startHour: 16, startMinute: 0, durationMin: 30 },
  ],
  anomalies: [
    {
      missionDay: 12,
      utcHour: 13,
      utcMinute: 0,
      durationMinutes: 240, // 4h Solar Particle Event (SPE)
      peakHeartRate: 95,
      peakRadiationMsvHourly: 0.38,
      stressLevelBoost: 3,
      label: "solar_particle_event",
    },
    {
      missionDay: 15,
      utcHour: 0,
      utcMinute: 12,
      durationMinutes: 18,
      peakHeartRate: 168,
      stressLevelBoost: 4,
      label: "cardio_alert",
    },
    {
      missionDay: 38,
      utcHour: 1,
      utcMinute: 0,
      durationMinutes: 300,
      peakHeartRate: 88,
      stressLevelBoost: 3,
      label: "isolation_insomnia",
    },
  ],
  outputPath: "public/data/mission-telemetry-60d.json",
};
