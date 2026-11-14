import { EXAM_THRESHOLDS, NASA_HAZARDS_KNOWLEDGE } from "@/data/nasaKnowledge";
import { EVALUATOR_COPY, type AppLocale } from "@/lib/locale";
import type {
  ActionableGuidance,
  BodySystemStatus,
  EscalationLevel,
  HealthEvaluation,
  HealthStatus,
  SystemStatusEntry,
  VitalReadings,
} from "@/types/health";

function scoreMetric(
  value: number,
  normal: { min?: number; max?: number },
  warning: { min?: number; max?: number }
): HealthStatus {
  const inRange = (range: { min?: number; max?: number }, v: number) => {
    if (range.min !== undefined && v < range.min) return false;
    if (range.max !== undefined && v > range.max) return false;
    return true;
  };
  if (inRange(normal, value)) return "normal";
  if (inRange(warning, value)) return "warning";
  return "critical";
}

function trendDelta(recent: VitalReadings[], pick: (v: VitalReadings) => number): number {
  if (recent.length < 2) return 0;
  const sorted = [...recent].sort((a, b) => a.missionDay - b.missionDay);
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  return pick(last) - pick(prev);
}

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = {
    normal: 0,
    warning: 1,
    critical: 2,
  };
  return rank[a] >= rank[b] ? a : b;
}

function systemForMetric(metric: string): BodySystemStatus {
  const map: Record<string, BodySystemStatus> = {
    systolicBP: "cardiovascular",
    diastolicBP: "cardiovascular",
    heartRate: "cardiovascular",
    bloodSugar: "metabolic",
    temperature: "metabolic",
    sleepHours: "neuro_behavioral",
    moodScore: "neuro_behavioral",
  };
  return map[metric] ?? "immune_musculoskeletal";
}

function buildGuidance(
  hazards: Set<string>,
  actions: string[],
  why: string
): ActionableGuidance {
  const hazardImpact = NASA_HAZARDS_KNOWLEDGE.filter((h) =>
    hazards.has(h.hazard)
  ).map((h) => h.hazard);
  return {
    whyNeededInSpace: why,
    hazardImpact,
    recommendedActions: actions,
  };
}

/**
 * Pure offline evaluator — Dev 2 extends thresholds and escalation rules here.
 */
export function evaluateHealth(
  current: VitalReadings,
  recentHistory: VitalReadings[] = [],
  locale: AppLocale = "es"
): HealthEvaluation {
  const copy = EVALUATOR_COPY[locale];
  const history = [...recentHistory, current].sort(
    (a, b) => a.missionDay - b.missionDay
  );

  const metricStatuses: Record<string, HealthStatus> = {};
  for (const th of EXAM_THRESHOLDS) {
    const value = current[th.metric] as number;
    metricStatuses[th.metric] = scoreMetric(value, th.normal, th.warning);
  }

  if (current.radiationMsv !== undefined && current.radiationMsv > 1) {
    metricStatuses.radiation = "warning";
    if (current.radiationMsv > 1.5) metricStatuses.radiation = "critical";
  }

  const bpTrend = trendDelta(history, (v) => v.systolicBP);
  const sleepTrend = trendDelta(history, (v) => v.sleepHours);
  if (bpTrend >= 8) {
    metricStatuses.systolicBP = worst(
      metricStatuses.systolicBP,
      "warning"
    );
  }
  if (sleepTrend <= -1.5) {
    metricStatuses.sleepHours = worst(metricStatuses.sleepHours, "warning");
  }

  const bySystem = new Map<BodySystemStatus, HealthStatus>();
  for (const th of EXAM_THRESHOLDS) {
    const sys = systemForMetric(th.metric);
    const st = metricStatuses[th.metric];
    bySystem.set(sys, worst(bySystem.get(sys) ?? "normal", st));
  }
  if (metricStatuses.radiation === "warning" || metricStatuses.radiation === "critical") {
    bySystem.set(
      "immune_musculoskeletal",
      worst(bySystem.get("immune_musculoskeletal") ?? "normal", metricStatuses.radiation)
    );
  }

  const systemStatuses: SystemStatusEntry[] = (
    [
      "cardiovascular",
      "neuro_behavioral",
      "metabolic",
      "immune_musculoskeletal",
    ] as const
  ).map((system) => ({
    system,
    status: bySystem.get(system) ?? "normal",
    summary:
      (bySystem.get(system) ?? "normal") === "normal"
        ? copy.systemNormal
        : copy.systemWarning,
  }));

  let overallStatus: HealthStatus = "normal";
  for (const st of Object.values(metricStatuses)) {
    overallStatus = worst(overallStatus, st);
  }
  for (const s of systemStatuses) {
    overallStatus = worst(overallStatus, s.status);
  }

  let escalationLevel: EscalationLevel = "self_care";
  if (overallStatus === "warning") escalationLevel = "crew_attention";
  if (overallStatus === "critical") escalationLevel = "ground_flight_surgeon";
  if (
    current.systolicBP >= 160 ||
    current.heartRate >= 120 ||
    current.temperature >= 38.2
  ) {
    escalationLevel = "ground_flight_surgeon";
    overallStatus = "critical";
  }

  const guidance: ActionableGuidance[] = [];
  const hazardTags = new Set<string>();

  if (
    metricStatuses.systolicBP !== "normal" ||
    metricStatuses.heartRate !== "normal"
  ) {
    hazardTags.add("gravity");
    hazardTags.add("distance");
    guidance.push(
      buildGuidance(
        hazardTags,
        copy.guidance.cardio.actions,
        copy.guidance.cardio.why
      )
    );
  }

  if (
    metricStatuses.sleepHours !== "normal" ||
    metricStatuses.moodScore !== "normal"
  ) {
    hazardTags.add("isolation");
    hazardTags.add("closed_environment");
    guidance.push(
      buildGuidance(
        hazardTags,
        copy.guidance.neuro.actions,
        copy.guidance.neuro.why
      )
    );
  }

  if (metricStatuses.bloodSugar !== "normal" || metricStatuses.temperature !== "normal") {
    hazardTags.add("closed_environment");
    hazardTags.add("distance");
    guidance.push(
      buildGuidance(
        hazardTags,
        copy.guidance.metabolic.actions,
        copy.guidance.metabolic.why
      )
    );
  }

  if (guidance.length === 0) {
    guidance.push(
      buildGuidance(
        new Set(["distance"]),
        copy.guidance.default.actions,
        copy.guidance.default.why
      )
    );
  }

  const headline =
    escalationLevel === "ground_flight_surgeon"
      ? copy.headlines.ground
      : escalationLevel === "crew_attention"
        ? copy.headlines.crew
        : copy.headlines.ok;

  return {
    overallStatus,
    escalationLevel,
    systemStatuses,
    guidance,
    headline,
  };
}