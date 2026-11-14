import { EXAM_THRESHOLDS, NASA_HAZARDS_KNOWLEDGE } from "@/data/nasaKnowledge";
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
  recentHistory: VitalReadings[] = []
): HealthEvaluation {
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
        ? "Within expected range for this mission phase."
        : "One or more readings need a closer look.",
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
        [
          "Re-check blood pressure after 5 minutes of rest.",
          "Review hydration and today's exercise completion.",
          "Inform crew medical officer if reading repeats.",
        ],
        "Cardiovascular shifts are common in microgravity but sudden spikes need action."
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
        [
          "Protect a 7-hour sleep window tonight.",
          "Brief crew check-in on workload.",
          "Use relaxation protocol before sleep.",
        ],
        "Sleep and mood are early signals of isolation stress on long missions."
      )
    );
  }

  if (metricStatuses.bloodSugar !== "normal" || metricStatuses.temperature !== "normal") {
    hazardTags.add("closed_environment");
    hazardTags.add("distance");
    guidance.push(
      buildGuidance(
        hazardTags,
        [
          "Confirm meal timing and hydration log.",
          "Take temperature again in 30 minutes.",
          "Contact ground surgeon if fever or glucose stays high.",
        ],
        "Metabolic changes can reflect cabin environment or emerging illness."
      )
    );
  }

  if (guidance.length === 0) {
    guidance.push(
      buildGuidance(
        new Set(["distance"]),
        ["Continue daily check-in routine.", "Log any new symptoms in notes."],
        "Regular vitals keep the crew ready when help from Earth is far away."
      )
    );
  }

  const headline =
    escalationLevel === "ground_flight_surgeon"
      ? "Escalate to ground flight surgeon"
      : escalationLevel === "crew_attention"
        ? "Crew medical attention recommended"
        : "On track — maintain daily routine";

  return {
    overallStatus,
    escalationLevel,
    systemStatuses,
    guidance,
    headline,
  };
}