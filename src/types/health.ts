/** NASA Human Research Program–style spaceflight hazards */
export type SpaceflightHazard =
  | "radiation"
  | "isolation"
  | "distance"
  | "gravity"
  | "closed_environment";

export type MissionEnvironment =
  | "spacecraft"
  | "station"
  | "rover"
  | "lunar_base";

export type HealthStatus = "normal" | "warning" | "critical";

export type EscalationLevel =
  | "self_care"
  | "crew_attention"
  | "ground_flight_surgeon";

export type BodySystemStatus =
  | "cardiovascular"
  | "neuro_behavioral"
  | "metabolic"
  | "immune_musculoskeletal";

export interface VitalReadings {
  missionDay: number;
  recordedAt: string;
  environment: MissionEnvironment;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  bloodSugar: number;
  temperature: number;
  sleepHours: number;
  moodScore: number;
  radiationMsv?: number;
  imageNoteOrDataUrl?: string;
  extraMetrics?: Record<string, number | string>;
}

export interface SystemStatusEntry {
  system: BodySystemStatus;
  status: HealthStatus;
  summary: string;
}

export interface ActionableGuidance {
  whyNeededInSpace: string;
  hazardImpact: SpaceflightHazard[];
  recommendedActions: string[];
}

export interface HealthEvaluation {
  overallStatus: HealthStatus;
  escalationLevel: EscalationLevel;
  systemStatuses: SystemStatusEntry[];
  guidance: ActionableGuidance[];
  headline: string;
}

export interface HazardKnowledgeBlock {
  hazard: SpaceflightHazard;
  title: string;
  shortDescription: string;
  whyMonitorInSpace: string;
  whatCanBeMeasured: string[];
  preventiveActions: string[];
  relatedSystems: BodySystemStatus[];
}

export interface ExamThreshold {
  metric: keyof Pick<
    VitalReadings,
    | "systolicBP"
    | "diastolicBP"
    | "heartRate"
    | "bloodSugar"
    | "temperature"
    | "sleepHours"
    | "moodScore"
  >;
  normal: { min?: number; max?: number };
  warning: { min?: number; max?: number };
  unit: string;
  label: string;
}