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

/** @deprecated Legacy single-scale toggle — panels use CardioChartScale | RecoveryChartScale | RadiationChartScale */
export type ChartTimeGranularity = "minutes" | "hours" | "days";

export type ChartPanelId = "cardio" | "recovery" | "radiation";

/** Cardiovascular panel — short (5 s / 1 min) vs daily HR range (exercise vs illness) */
export type CardioChartScale = "5sec" | "minute" | "day";

/**
 * Recovery / metabolic — daily sleep + stress (circadian drift) or hourly glucose (metabolic stress).
 */
export type RecoveryChartScale = "day" | "hour";

/** Radiation — hourly dose rate within a day, or daily dose + mission cumulative */
export type RadiationChartScale = "day" | "hour";

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

/** Single 5-second (or configured) high-resolution telemetry row in the hot layer */
export interface TelemetryHotSample {
  recordedAt: string;
  missionDay: number;
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number;
  temperature: number;
  radiationMsv?: number;
  stressLevel?: number;
  moodScore?: number;
}

/** Aggregated bucket for warm/cold chart paths (minute or hour) */
export interface TelemetryRollupBucket {
  bucketStart: string;
  missionDay: number;
  bucketKind: "minute" | "hour";
  heartRateAvg: number;
  heartRateMin: number;
  heartRateMax: number;
  systolicAvg: number;
  sampleCount: number;
  bloodSugarAvg?: number;
  temperatureAvg?: number;
  radiationDose?: number;
  stressAvg?: number;
  moodAvg?: number;
}

export interface TelemetryAnomalySpec {
  missionDay: number;
  utcHour: number;
  utcMinute: number;
  durationMinutes: number;
  peakHeartRate?: number;
  peakRadiationMsvHourly?: number;
  stressLevelBoost?: number;
  label?: string;
}

export interface MissionTelemetryArchiveMeta {
  version: 1;
  missionDays: number;
  sampleIntervalSec: number;
  hotWindowHours: number;
  generatedAt: string;
  missionStartIso: string;
  astronautId?: string;
  environment: MissionEnvironment;
  seed: string;
}

/** Layered mission dataset — raw hot path plus rollups for long horizons */
export interface MissionTelemetryArchive {
  meta: MissionTelemetryArchiveMeta;
  daily: VitalReadings[];
  anomalies: TelemetryAnomalySpec[];
  hot: TelemetryHotSample[];
  rollups: {
    minute: TelemetryRollupBucket[];
    hour: TelemetryRollupBucket[];
  };
}

/** 1 = low / negative, 5 = high / positive (wording varies per question) */
export type MentalHealthLikert = 1 | 2 | 3 | 4 | 5;

export type MentalHealthQuestionCategory =
  | "mood"
  | "sleep"
  | "isolation"
  | "stress"
  | "focus"
  | "crew";

export interface MentalHealthLocalizedText {
  en: string;
  es: string;
}

export interface MentalHealthQuestion {
  id: string;
  text: MentalHealthLocalizedText;
  category: MentalHealthQuestionCategory;
  /** When true, higher Likert = worse for composite scoring */
  inverted?: boolean;
}

export interface MentalHealthAnswer {
  questionId: string;
  value: MentalHealthLikert;
}

export interface MentalHealthSurveySubmission {
  id: string;
  submittedAt: string;
  astronautId?: string;
  missionDay?: number;
  sessionQuestionIds: string[];
  answers: MentalHealthAnswer[];
  /** 0–100 wellness index derived from answers */
  compositeScore: number;
}

export interface MemoryGameResult {
  submittedAt: string;
  gridSize: 5;
  totalPairs: number;
  pairsFound: number;
  moves: number;
  elapsedSec: number;
  /** 0–100 — fewer moves and less time yield higher scores */
  memoryScore: number;
}

/** DONKI solar flare (FLR) record — subset of NASA / CCMC JSON */
export interface DonkiFlareRecord {
  flrID: string;
  beginTime: string;
  peakTime: string;
  endTime: string;
  classType: string;
  sourceLocation?: string;
  activeRegionNum?: number;
  link?: string;
  linkedEvents?: Array<{ activityID: string }> | null;
}

export type DonkiFlareFeedSource =
  | "nasa_donki_api"
  | "ccmc_donki_api"
  | "mock_ground_api";

export type DonkiFlareAlertSeverity = "none" | "watch" | "warning" | "critical";

export interface DonkiFlareFeedResponse {
  ok: boolean;
  source: DonkiFlareFeedSource;
  startDate: string;
  endDate: string;
  flares: DonkiFlareRecord[];
  alert: {
    active: boolean;
    severity: DonkiFlareAlertSeverity;
    headline: string;
    peakFlare: DonkiFlareRecord | null;
  };
  note: string;
  fetchedAt: string;
}