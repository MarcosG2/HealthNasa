import type { MissionEnvironment, TelemetryAnomalySpec } from "../../src/types/health";

export interface GeneratorConfig {
  missionDays: number;
  sampleIntervalSec: number;
  hotWindowHours: number;
  missionStartIso: string;
  environment: MissionEnvironment;
  astronautId?: string;
  seed: string;
  sleepUtc: { startHour: number; endHour: number };
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
      missionDay: 15,
      utcHour: 0,
      utcMinute: 12,
      durationMinutes: 18,
      peakHeartRate: 168,
      label: "cardio_alert",
    },
  ],
  outputPath: "public/data/mission-telemetry-60d.json",
};