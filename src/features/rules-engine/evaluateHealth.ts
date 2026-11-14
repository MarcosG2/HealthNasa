import { EXAM_THRESHOLDS, NASA_HAZARDS_KNOWLEDGE } from "@/data/nasaKnowledge";
import { EVALUATOR_COPY, ENVIRONMENT_MISSION_META, type AppLocale } from "@/lib/locale";
import type {
  ActionableGuidance,
  BodySystemStatus,
  EscalationLevel,
  HealthEvaluation,
  HealthStatus,
  MissionEnvironment,
  SpaceflightHazard,
  SystemStatusEntry,
  VitalReadings,
} from "@/types/health";

function radiationStatusForEnvironment(
  dose: number,
  environment: MissionEnvironment
): HealthStatus {
  const deepSpace =
    environment === "spacecraft" || environment === "mars_base";
  const warningAt = deepSpace ? 0.85 : 1.0;
  const criticalAt = deepSpace ? 1.2 : 1.5;
  if (dose > criticalAt) return "critical";
  if (dose > warningAt) return "warning";
  return "normal";
}

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
    stressLevel: "neuro_behavioral",
    radiationMsv: "immune_musculoskeletal",
  };
  return map[metric] ?? "immune_musculoskeletal";
}

function buildGuidance(
  hazards: Set<SpaceflightHazard>,
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

function reactionTimeMs(current: VitalReadings): number | undefined {
  const raw = current.extraMetrics?.reactionTimeMs;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Pure offline evaluator — Dev 2 extends thresholds and escalation rules here.
 */
export function evaluateHealth(
  current: VitalReadings,
  recentHistory: VitalReadings[] = [],
  locale: AppLocale = "en"
): HealthEvaluation {
  const copy = EVALUATOR_COPY[locale];
  const environment = current.environment;
  const envMeta = ENVIRONMENT_MISSION_META[locale][environment];
  const history = [...recentHistory, current].sort(
    (a, b) => a.missionDay - b.missionDay
  );

  const metricStatuses: Record<string, HealthStatus> = {};
  for (const th of EXAM_THRESHOLDS) {
    if (th.metric === "radiationMsv" || th.metric === "stressLevel") continue;
    const value = current[th.metric] as number;
    metricStatuses[th.metric] = scoreMetric(value, th.normal, th.warning);
  }

  if (current.radiationMsv !== undefined) {
    const st = radiationStatusForEnvironment(current.radiationMsv, environment);
    metricStatuses.radiationMsv = st;
    metricStatuses.radiation = st;
  }

  if (current.stressLevel !== undefined) {
    const stress = current.stressLevel;
    let st: HealthStatus = "normal";
    if (stress >= 8) st = "critical";
    else if (stress >= 6) st = "warning";
    metricStatuses.stressLevel = st;
  }

  const reactionMs = reactionTimeMs(current);
  if (reactionMs !== undefined) {
    let st: HealthStatus = "normal";
    if (reactionMs > 650) st = "critical";
    else if (reactionMs > 450) st = "warning";
    metricStatuses.reactionTimeMs = st;
  }

  const bpTrend = trendDelta(history, (v) => v.systolicBP);
  const sleepTrend = trendDelta(history, (v) => v.sleepHours);
  if (bpTrend >= 8) {
    metricStatuses.systolicBP = worst(metricStatuses.systolicBP, "warning");
  }
  if (sleepTrend <= -1.5) {
    metricStatuses.sleepHours = worst(metricStatuses.sleepHours, "warning");
  }

  const bySystem = new Map<BodySystemStatus, HealthStatus>();
  for (const th of EXAM_THRESHOLDS) {
    if (th.metric === "radiationMsv" || th.metric === "stressLevel") continue;
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
  if (metricStatuses.stressLevel) {
    bySystem.set(
      "neuro_behavioral",
      worst(bySystem.get("neuro_behavioral") ?? "normal", metricStatuses.stressLevel)
    );
  }
  if (metricStatuses.reactionTimeMs) {
    bySystem.set(
      "neuro_behavioral",
      worst(bySystem.get("neuro_behavioral") ?? "normal", metricStatuses.reactionTimeMs)
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
    (environment === "spacecraft" || environment === "mars_base") &&
    metricStatuses.radiation === "warning"
  ) {
    escalationLevel = worstEscalation(escalationLevel, "crew_attention");
  }
  if (
    current.systolicBP >= 160 ||
    current.heartRate >= 120 ||
    current.temperature >= 38.2
  ) {
    escalationLevel = "ground_flight_surgeon";
    overallStatus = "critical";
  }
  if (
    (current.stressLevel !== undefined && current.stressLevel >= 8) ||
    (metricStatuses.reactionTimeMs === "warning" ||
      metricStatuses.reactionTimeMs === "critical")
  ) {
    escalationLevel = worstEscalation(escalationLevel, "crew_attention");
    if (
      current.stressLevel !== undefined &&
      current.stressLevel >= 8 &&
      (metricStatuses.sleepHours === "critical" ||
        metricStatuses.moodScore === "critical")
    ) {
      escalationLevel = worstEscalation(escalationLevel, "crew_attention");
    }
  }

  const guidance: ActionableGuidance[] = [];

  if (
    metricStatuses.systolicBP !== "normal" ||
    metricStatuses.heartRate !== "normal"
  ) {
    guidance.push(
      buildGuidance(
        new Set(["gravity", "distance"]),
        copy.guidance.cardio.actions,
        copy.guidance.cardio.why
      )
    );
  }

  if (
    metricStatuses.sleepHours !== "normal" ||
    metricStatuses.moodScore !== "normal" ||
    (metricStatuses.stressLevel && metricStatuses.stressLevel !== "normal") ||
    (metricStatuses.reactionTimeMs && metricStatuses.reactionTimeMs !== "normal")
  ) {
    guidance.push(
      buildGuidance(
        new Set(["isolation", "closed_environment"]),
        copy.guidance.neuro.actions,
        copy.guidance.neuro.why
      )
    );
  }

  if (metricStatuses.bloodSugar !== "normal" || metricStatuses.temperature !== "normal") {
    guidance.push(
      buildGuidance(
        new Set(["closed_environment", "distance"]),
        copy.guidance.metabolic.actions,
        copy.guidance.metabolic.why
      )
    );
  }

  if (metricStatuses.radiation === "warning" || metricStatuses.radiation === "critical") {
    guidance.push(
      buildGuidance(
        new Set(["radiation"]),
        [
          locale === "es"
            ? "Refugio en módulo blindado y repetir dosimetría."
            : "Shelter in shielded module and repeat dosimetry.",
          locale === "es"
            ? "Informar al oficial médico y registrar fatiga."
            : "Inform crew medical officer and log fatigue.",
        ],
        locale === "es"
          ? "Picos de radiación afectan inmunidad y requieren contramedidas inmediatas."
          : "Radiation spikes affect immunity and need immediate countermeasures.",
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

  if (environment === "spacecraft" || environment === "mars_base") {
    guidance.push(
      buildGuidance(
        new Set(["distance", "radiation"]),
        locale === "es"
          ? [
              "Actuar de forma autónoma: el consultor en Tierra recibe datos con retraso (" +
                envMeta.latencyLabel +
                ").",
              "Documentar síntomas neuro-ocular (SANS) y escalar localmente si la visión cambia.",
            ]
          : [
              "Act autonomously: ground consult is delayed (" + envMeta.latencyLabel + ").",
              "Log neuro-ocular SANS symptoms and escalate locally if vision shifts.",
            ],
        locale === "es"
          ? "En tránsito profundo o en Marte la señal tarda minutos; las decisiones urgentes deben seguir reglas HRP a bordo."
          : "Deep transit or Mars link delay is measured in minutes; urgent calls follow onboard HRP rules.",
      )
    );
  }

  if (environment === "rover" || environment === "lunar_base") {
    guidance.push(
      buildGuidance(
        new Set(["gravity", "closed_environment"]),
        locale === "es"
          ? [
              "Chequeo post-EVA: hidratación, irritación por polvo lunar y estrés térmico del traje.",
              "Registrar presión arterial y FC 30 min tras reingreso al hábitat.",
            ]
          : [
              "Post-EVA check: hydration, lunar dust irritation, and suit thermal stress.",
              "Re-check blood pressure and heart rate 30 min after re-entry.",
            ],
        locale === "es"
          ? "En superficie, el polvo y la gravedad parcial amplifican deshidratación y fatiga tras cada salida."
          : "On the surface, dust and partial gravity amplify dehydration and fatigue after each EVA.",
      )
    );
  }

  if (environment === "station") {
    guidance.push(
      buildGuidance(
        new Set(["closed_environment", "gravity"]),
        locale === "es"
          ? [
              "Monitorizar CO₂ de cabina y síntomas de hipoxia leve (cefalea, somnolencia).",
              "Anotar cambios de visión asociados a SANS y fluidos en microgravedad.",
            ]
          : [
              "Track cabin CO₂ and mild hypoxia signs (headache, drowsiness).",
              "Log vision shifts linked to SANS and fluid redistribution in microgravity.",
            ],
        locale === "es"
          ? "La estación combina ambiente cerrado y microgravedad: CO₂ y SANS son riesgos HRP frecuentes."
          : "The station mixes closed ecology and microgravity; CO₂ and SANS are common HRP risks.",
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

function worstEscalation(a: EscalationLevel, b: EscalationLevel): EscalationLevel {
  const rank: Record<EscalationLevel, number> = {
    self_care: 0,
    crew_attention: 1,
    ground_flight_surgeon: 2,
  };
  return rank[a] >= rank[b] ? a : b;
}