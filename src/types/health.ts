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
  | "lunar_base"
  | "mars_base";

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

/** Demo mission scenario toggles in the dashboard simulation row */
export type MissionScenarioId = "solar" | "cardio" | "isolation";

/** Mission timeline chart bucket for HealthCharts time-scale toggles */
export type ChartTimeGranularity = "minutes" | "hours" | "days";

export type AstronautHealthArchetype =
  | "healthy"
  | "cardio_warning"
  | "radiation_exposure"
  | "isolation_stress"
  | "metabolic_drift"
  | "multi_system_critical";

export interface MockAstronautProfile {
  id: string;
  callSign: string;
  fullName: string;
  agency: string;
  role: string;
  archetype: AstronautHealthArchetype;
  homeEnvironment: MissionEnvironment;
  /** Optional demo scenarios that match this crew member's chart */
  typicalScenarios: MissionScenarioId[];
}

export interface OfficialReferenceLink {
  label: string;
  url: string;
}

export interface MissionProfile {
  missionName: string;
  commanderRole: string;
  medicalOfficerRole: string;
  program: string;
}

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
  /** 1 = calm, 10 = extreme stress */
  stressLevel?: number;
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
  hrpRisks?: string[];
  officialLinks?: OfficialReferenceLink[];
}

export type VitalsFormMetric =
  | keyof Pick<
      VitalReadings,
      | "systolicBP"
      | "diastolicBP"
      | "heartRate"
      | "bloodSugar"
      | "temperature"
      | "sleepHours"
      | "moodScore"
    >
  | "radiationMsv"
  | "stressLevel";

export interface ExamThreshold {
  metric: VitalsFormMetric;
  normal: { min?: number; max?: number };
  warning: { min?: number; max?: number };
  unit: string;
  label: string;
}

export interface EnvironmentMissionMeta {
  latencyLabel: string;
  latencyMs: number;
  primaryHazards: SpaceflightHazard[];
  autonomyNote: string;
  habitatName: string;
  operationsContext: string;
  healthFocus: string;
  scenarioContext: string;
}