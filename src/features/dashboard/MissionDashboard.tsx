"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ASTRONAUT_ROSTER, archetypeLabel } from "@/data/astronautRoster";
import {
  AlertTriangle,
  Clock,
  Languages,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { buildMockMissionHistory, MOCK_MISSION_HISTORY } from "@/data/mockMissionHistory";
import { BodyMap } from "@/features/body-map/BodyMap";
import { evaluateHealth } from "@/features/rules-engine/evaluateHealth";
import { HealthCharts } from "@/features/timeline/HealthCharts";
import { MissionRoutinePanel } from "@/features/vitals-form/MissionRoutinePanel";
import { VitalsInputForm } from "@/features/vitals-form/VitalsInputForm";
import {
  ENVIRONMENT_LABELS,
  ENVIRONMENT_MISSION_META,
  HAZARD_DISPLAY,
  LOCALE_STORAGE_KEY,
  MISSION_PROFILE,
  statusLabelForLocale,
  type AppLocale,
  UI_STRINGS,
  escalationLabel,
} from "@/lib/locale";
import { statusStyles } from "@/lib/statusColors";
import { fetchAstronautRoster, fetchMissionFeed } from "@/lib/fetchMissionFeed";
import { mergeActiveScenarios } from "@/lib/mergeMissionScenarios";
import type {
  MissionEnvironment,
  MissionScenarioId,
  MockAstronautProfile,
  VitalReadings,
} from "@/types/health";

const LOG_KEY = "healthnasa_mission_logs";
const SCENARIOS_KEY = "healthnasa_active_scenarios";
const ASTRONAUT_KEY = "healthnasa_astronaut_id";

const SCENARIO_LABEL: Record<
  AppLocale,
  Record<MissionScenarioId, string>
> = {
  es: {
    solar: "Partículas solares",
    cardio: "Cardio / deshidratación",
    isolation: "Aislamiento",
  },
  en: {
    solar: "Solar particles",
    cardio: "Cardio / dehydration",
    isolation: "Isolation",
  },
};

function loadLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "en" || raw === "es") return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

const ENVIRONMENT_IDS: MissionEnvironment[] = [
  "station",
  "spacecraft",
  "rover",
  "lunar_base",
  "mars_base",
];

function loadLogs(): VitalReadings[] {
  if (typeof window === "undefined") return MOCK_MISSION_HISTORY;
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VitalReadings[];
      if (parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return MOCK_MISSION_HISTORY;
}

function saveLogs(logs: VitalReadings[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {
    /* ignore */
  }
}

function loadActiveScenarios(): MissionScenarioId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MissionScenarioId[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveActiveScenarios(scenarios: MissionScenarioId[]) {
  try {
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  } catch {
    /* ignore */
  }
}

function loadAstronautId(): string {
  if (typeof window === "undefined") return ASTRONAUT_ROSTER[0]?.id ?? "eva-chen";
  try {
    return localStorage.getItem(ASTRONAUT_KEY) ?? ASTRONAUT_ROSTER[0]?.id ?? "eva-chen";
  } catch {
    return ASTRONAUT_ROSTER[0]?.id ?? "eva-chen";
  }
}

function saveAstronautId(id: string) {
  try {
    localStorage.setItem(ASTRONAUT_KEY, id);
  } catch {
    /* ignore */
  }
}

function findLastVisualAttachment(
  logs: VitalReadings[]
): { url: string; missionDay: number } | null {
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const url = logs[i].imageNoteOrDataUrl;
    if (url?.startsWith("data:image")) {
      return { url, missionDay: logs[i].missionDay };
    }
  }
  return null;
}

function applyScenarioOverlay(
  baseline: VitalReadings[],
  activeScenarios: MissionScenarioId[],
  environment: MissionEnvironment
): VitalReadings[] {
  if (activeScenarios.length === 0 || baseline.length === 0) return baseline;
  const last = baseline[baseline.length - 1];
  const merged = mergeActiveScenarios(last, activeScenarios, environment);
  return [...baseline.slice(0, -1), merged];
}

export function MissionDashboard() {
  const [baselineHistory, setBaselineHistory] =
    useState<VitalReadings[]>(MOCK_MISSION_HISTORY);
  const [activeScenarios, setActiveScenarios] = useState<MissionScenarioId[]>([]);
  const [environment, setEnvironment] = useState<MissionEnvironment>("station");
  const [locale, setLocale] = useState<AppLocale>("en");
  const [pendingReactionMs, setPendingReactionMs] = useState<number | undefined>();
  const [mockFeedLabel, setMockFeedLabel] = useState<string | null>(null);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>("eva-chen");
  const [roster, setRoster] = useState<MockAstronautProfile[]>(ASTRONAUT_ROSTER);
  const baselineLoadSeq = useRef(0);

  useEffect(() => {
    // Post-mount hydration: SSR uses MOCK_MISSION_HISTORY; client restores saved logs.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
    setBaselineHistory(loadLogs());
    setLocale(loadLocale());
    setActiveScenarios(loadActiveScenarios());
    const astronautId = loadAstronautId();
    setSelectedAstronautId(astronautId);

    let cancelled = false;
    void fetchAstronautRoster().then((list) => {
      if (!cancelled && list?.length) setRoster(list);
    });

    const hasSaved =
      typeof window !== "undefined" && Boolean(localStorage.getItem(LOG_KEY));
    if (!hasSaved) {
      void fetchMissionFeed("station", 14, astronautId).then((feed) => {
        if (cancelled || !feed?.telemetry?.length) return;
        setBaselineHistory(feed.telemetry);
        setEnvironment(feed.environment);
        saveLogs(feed.telemetry);
        setMockFeedLabel(
          `${feed.crew.callSign} · ${feed.crew.agency} · ${feed.source}`
        );
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const history = useMemo(
    () => applyScenarioOverlay(baselineHistory, activeScenarios, environment),
    [baselineHistory, activeScenarios, environment]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const ui = UI_STRINGS[locale];
  const profile = MISSION_PROFILE[locale];
  const envMeta = ENVIRONMENT_MISSION_META[locale][environment];

  const latest =
    history[history.length - 1] ??
    MOCK_MISSION_HISTORY[MOCK_MISSION_HISTORY.length - 1];
  const evaluation = useMemo(
    () => evaluateHealth(latest, history.slice(0, -1), locale),
    [latest, history, locale]
  );

  const overallStyles = statusStyles(evaluation.overallStatus);
  const selectedAstronaut =
    roster.find((a) => a.id === selectedAstronautId) ?? roster[0];

  const appendReading = useCallback((reading: VitalReadings) => {
    setBaselineHistory((prev) => {
      const next = [...prev.filter((p) => p.missionDay !== reading.missionDay), reading].sort(
        (a, b) => a.missionDay - b.missionDay
      );
      saveLogs(next);
      void fetch("/api/health-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reading, syncAck: true }),
      }).catch(() => {
        /* optional ground sync */
      });
      return next;
    });
  }, []);

  async function restoreBaselineFromFeed(
    astronautId = selectedAstronautId,
    env: MissionEnvironment = environment
  ) {
    const seq = ++baselineLoadSeq.current;
    const feed = await fetchMissionFeed(env, 14, astronautId);
    if (seq !== baselineLoadSeq.current) return;

    if (feed?.telemetry?.length) {
      const telemetry = feed.telemetry.map((row) => ({ ...row, environment: env }));
      setBaselineHistory(telemetry);
      setEnvironment(env);
      saveLogs(telemetry);
      setMockFeedLabel(
        `${feed.crew.callSign} · ${feed.crew.agency} · ${feed.source}`
      );
      return;
    }
    const baseline = buildMockMissionHistory(env);
    setBaselineHistory(baseline);
    setEnvironment(env);
    saveLogs(baseline);
  }

  function resetBaseline() {
    setActiveScenarios([]);
    saveActiveScenarios([]);
    void restoreBaselineFromFeed();
  }

  function toggleScenario(scenarioId: MissionScenarioId) {
    setActiveScenarios((prev) => {
      const next = prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId];
      saveActiveScenarios(next);
      return next;
    });
  }

  async function onSelectAstronaut(astronautId: string) {
    setSelectedAstronautId(astronautId);
    saveAstronautId(astronautId);
    setActiveScenarios([]);
    saveActiveScenarios([]);
    await restoreBaselineFromFeed(astronautId);
  }

  function toggleLocale() {
    setLocale((l) => (l === "es" ? "en" : "es"));
  }

  function onSelectEnvironment(env: MissionEnvironment) {
    if (env === environment) return;
    setEnvironment(env);
    void restoreBaselineFromFeed(selectedAstronautId, env);
  }

  const lastVisualAttachment = findLastVisualAttachment(history);

  const nextDay = (latest?.missionDay ?? 14) + 1;
  const envLabel = ENVIRONMENT_LABELS[locale][environment];

  return (
    <div className="mission-shell">
      <a href="#main-content" className="skip-link">
        {ui.skipToMain}
      </a>

      <header className="mission-command">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-box border border-primary/40 bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{ui.appTitle}</h1>
                <p className="mt-0.5 max-w-prose text-sm text-base-content/75">{ui.appSubtitle}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch lg:max-w-xl">
              <button
                type="button"
                onClick={toggleLocale}
                className="btn btn-sm btn-ghost order-2 gap-2 border border-base-300/60 sm:order-1 sm:self-start"
                aria-label={
                  locale === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish"
                }
              >
                <Languages className="h-4 w-4" aria-hidden />
                {ui.switchToEnglish}
              </button>
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                aria-label={ui.crewStatusLive}
                className={`mission-panel order-1 flex flex-1 gap-3 p-3 ring-1 sm:order-2 ${overallStyles.ring} ${overallStyles.bg}`}
              >
                <Radio className={`mt-0.5 h-5 w-5 shrink-0 ${overallStyles.text}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug text-base-content">
                    {evaluation.headline}
                  </p>
                  <p
                    className={`mt-1 text-xs font-semibold uppercase tracking-wide ${overallStyles.text}`}
                  >
                    {statusLabelForLocale(locale, evaluation.overallStatus)}
                  </p>
                </div>
                <p className="mission-readout ml-auto hidden self-center sm:block">
                  {ui.missionDay} {latest.missionDay}
                </p>
              </div>
            </div>
          </div>

          <dl
            aria-label={ui.artemisProfile}
            className="grid gap-px overflow-hidden rounded-box border border-base-300/70 bg-base-300/50 sm:grid-cols-3"
          >
            <TelemetryField icon={Users} label={ui.artemisProfile}>
              <p className="font-medium text-base-content">
                {selectedAstronaut?.fullName ?? profile.missionName}
              </p>
              <p className="text-base-content/80">
                {selectedAstronaut?.callSign ?? profile.commanderRole} ·{" "}
                {selectedAstronaut?.role ?? profile.medicalOfficerRole}
              </p>
              <p className="text-xs text-base-content/70">
                {selectedAstronaut
                  ? archetypeLabel(selectedAstronaut.archetype, locale)
                  : profile.program}
              </p>
              <p className="mission-readout text-primary/90">{envLabel}</p>
            </TelemetryField>
            <TelemetryField icon={Clock} label={ui.communicationLatency}>
              <p className="mission-readout text-lg text-primary">{envMeta.latencyLabel}</p>
            </TelemetryField>
            <TelemetryField icon={Shield} label={ui.activeEnvironmentRisks}>
              <p className="leading-snug">
                {envMeta.primaryHazards
                  .map((h) => HAZARD_DISPLAY[locale][h].title)
                  .join(" · ")}
              </p>
            </TelemetryField>
          </dl>

          <div className="grid gap-3 lg:grid-cols-2">
            <p className="rounded-field border border-base-300/60 bg-base-100/40 px-4 py-3 text-sm leading-relaxed text-base-content/85">
              <span className="font-medium text-base-content">{ui.whyAutonomous}. </span>
              {envMeta.autonomyNote}
            </p>
            <div className="rounded-field border border-base-300/60 bg-base-100/40 px-4 py-3 text-sm leading-relaxed text-base-content/85">
              <p className="font-medium text-base-content">{ui.environmentBrief}</p>
              <p className="mt-1">
                <span className="text-base-content/70">{ui.habitatLabel}: </span>
                {envMeta.habitatName}
              </p>
              <p className="mt-1">
                <span className="text-base-content/70">{ui.healthFocusLabel}: </span>
                {envMeta.healthFocus}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8"
      >
        <section aria-labelledby="sim-controls-heading">
          <h2 id="sim-controls-heading" className="sr-only">
            {ui.simulationControls}
          </h2>
          <div className="mission-panel p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="mission-section-title">{ui.simulationControls}</p>
              <p className="mission-readout text-base-content/80 lg:text-right">
                {ui.missionDay} {latest.missionDay} · {envLabel}
              </p>
            </div>
            <p className="mt-2 text-xs text-base-content/65">{ui.scenarioTapToDeactivate}</p>
            <p className="mt-2 text-xs text-base-content/70">
              <span className="font-medium text-base-content">{ui.activeScenariosLabel}: </span>
              {activeScenarios.length > 0
                ? activeScenarios.map((id) => SCENARIO_LABEL[locale][id]).join(" · ")
                : ui.noActiveScenarios}
            </p>
            <p className="mt-1 text-xs text-base-content/65">{envMeta.scenarioContext}</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="block max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/65">
                  {ui.crewRoster}
                </span>
                <select
                  className="select select-bordered select-sm mt-1 w-full"
                  value={selectedAstronautId}
                  onChange={(e) => void onSelectAstronaut(e.target.value)}
                  aria-label={ui.selectAstronaut}
                >
                  {roster.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.callSign} — {member.fullName} (
                      {archetypeLabel(member.archetype, locale)}) ·{" "}
                      {ENVIRONMENT_LABELS[locale][member.homeEnvironment]}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/65">
                  {ui.missionEnvironment}
                </span>
                <div
                  className="mt-1 flex flex-wrap gap-2"
                  role="tablist"
                  aria-label={ui.missionEnvironment}
                >
                  {ENVIRONMENT_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={environment === id}
                      onClick={() => void onSelectEnvironment(id)}
                      className={`btn btn-xs sm:btn-sm ${
                        environment === id ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      {ENVIRONMENT_LABELS[locale][id]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {mockFeedLabel ? (
              <p className="mt-2 text-xs text-base-content/70">
                <span className="font-medium text-emerald-400">{ui.mockGroundFeedConnected}</span>
                {" · "}
                {ui.mockGroundFeed}
                {" — "}
                <span className="mission-readout">{mockFeedLabel}</span>
              </p>
            ) : null}
            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label={ui.simulationControls}
            >
              <ScenarioButton
                icon={Sun}
                label={ui.simulateSolarEvent}
                active={activeScenarios.includes("solar")}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={() => toggleScenario("solar")}
                tone="amber"
              />
              <ScenarioButton
                icon={AlertTriangle}
                label={ui.simulateCardioDehydration}
                active={activeScenarios.includes("cardio")}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={() => toggleScenario("cardio")}
                tone="rose"
              />
              <ScenarioButton
                icon={Radio}
                label={ui.simulateIsolationDrift}
                active={activeScenarios.includes("isolation")}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={() => toggleScenario("isolation")}
                tone="violet"
              />
              <ScenarioButton
                icon={RotateCcw}
                label={ui.resetBaseline}
                active={activeScenarios.length === 0}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={resetBaseline}
                tone="neutral"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-12">
          <section
            className="space-y-8 xl:col-span-8"
            aria-labelledby="body-systems-heading"
          >
            <MotionReveal>
              <h2 id="body-systems-heading" className="mission-section-title mb-4">
                {ui.bodyMapTitle}
              </h2>
              <BodyMap systemStatuses={evaluation.systemStatuses} locale={locale} />
            </MotionReveal>

            <MotionReveal>
              <h2 className="mission-section-title mb-4">{ui.missionTimeline}</h2>
              <HealthCharts history={history} locale={locale} environment={environment} />
            </MotionReveal>

            <MotionReveal>
              <h2 className="mission-section-title mb-4">{ui.logVitals}</h2>
              <VitalsInputForm
                key={`${environment}-${nextDay}`}
                environment={environment}
                missionDay={nextDay}
                locale={locale}
                onSubmit={appendReading}
                pendingReactionMs={pendingReactionMs}
              />
            </MotionReveal>
          </section>

          <aside className="space-y-6 xl:col-span-4 xl:sticky xl:top-6 xl:self-start">
            <MotionReveal>
              <h2 className="mission-section-title mb-4">{ui.recommendedActions}</h2>
              <ul className="space-y-3">
                {evaluation.guidance.map((g, i) => (
                  <li key={i} className="mission-panel p-4 text-sm text-base-content/85">
                    <p className="font-medium text-base-content">{g.whyNeededInSpace}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {g.recommendedActions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-base-content/75">
                {ui.escalation}:{" "}
                <span className="mission-readout text-primary">
                  {escalationLabel(locale, evaluation.escalationLevel)}
                </span>
              </p>
            </MotionReveal>

            <MotionReveal>
              <h2 className="mission-section-title mb-4">{ui.lastVisualInspection}</h2>
              <div className="mission-panel space-y-3 p-4 text-sm text-base-content/85">
                {lastVisualAttachment ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lastVisualAttachment.url}
                    alt={ui.uploadPreview}
                    className="max-h-48 w-full rounded-lg object-contain bg-base-300/40"
                  />
                ) : (
                  <p className="text-base-content/70">{ui.noVisualAttachment}</p>
                )}
                <p className="text-xs text-base-content/65">
                  {ui.groundSyncSimulated.replace("{latency}", envMeta.latencyLabel)}
                </p>
                {lastVisualAttachment ? (
                  <p className="mission-readout text-xs text-primary">
                    {ui.missionDay} {lastVisualAttachment.missionDay}
                  </p>
                ) : null}
              </div>
            </MotionReveal>

            <MotionReveal>
              <h2 className="mission-section-title mb-4">{ui.dailyCountermeasures}</h2>
              <MissionRoutinePanel
                locale={locale}
                onReactionRecorded={(ms) => setPendingReactionMs(ms)}
              />
              <p className="mt-4 text-sm leading-relaxed text-base-content/75">
                {profile.program}
              </p>
              <p className="mt-2 text-sm text-base-content/65">
                {locale === "es"
                  ? "La sincronización con Tierra es opcional; la evaluación clínica se ejecuta en el navegador."
                  : "Ground sync is optional; clinical evaluation runs entirely in the browser."}
              </p>
            </MotionReveal>
          </aside>
        </div>
      </main>

      <footer className="border-t border-base-300/60 bg-base-200/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-base-content">{ui.officialReferences}</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {OFFICIAL_FOOTER_LINKS.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}

const OFFICIAL_FOOTER_LINKS = [
  {
    label: "NASA HRP — Spaceflight Hazards",
    url: "https://www.nasa.gov/hrp/hazards/",
  },
  {
    label: "NASA HRP — Human Health Risks",
    url: "https://www.nasa.gov/hrp/risks/",
  },
  {
    label: "NASA HRP — Ongoing Research",
    url: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
  },
  {
    label: "CSA — Monitoring radiation & astronaut health",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
  },
  {
    label: "CSA — Science on the ISS",
    url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
  },
] as const;

function TelemetryField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-base-200/80 px-4 py-3">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-base-content/65">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        {label}
      </dt>
      <dd className="mt-2 space-y-0.5 text-sm text-base-content/90">{children}</dd>
    </div>
  );
}

type ScenarioTone = "amber" | "rose" | "violet" | "neutral";

const SCENARIO_TONE_CLASS: Record<ScenarioTone, { idle: string; active: string }> = {
  amber: {
    idle:
      "border-amber-500/35 bg-amber-500/5 text-amber-100/90 hover:border-amber-400/55 hover:bg-amber-500/15",
    active:
      "border-amber-400 bg-amber-500/25 text-amber-50 ring-2 ring-amber-400/70 ring-offset-2 ring-offset-base-200",
  },
  rose: {
    idle:
      "border-rose-500/35 bg-rose-500/5 text-rose-100/90 hover:border-rose-400/55 hover:bg-rose-500/15",
    active:
      "border-rose-400 bg-rose-500/25 text-rose-50 ring-2 ring-rose-400/70 ring-offset-2 ring-offset-base-200",
  },
  violet: {
    idle:
      "border-violet-500/35 bg-violet-500/5 text-violet-100/90 hover:border-violet-400/55 hover:bg-violet-500/15",
    active:
      "border-violet-400 bg-violet-500/25 text-violet-50 ring-2 ring-violet-400/70 ring-offset-2 ring-offset-base-200",
  },
  neutral: {
    idle:
      "border-base-300 bg-base-100/40 text-base-content hover:border-base-content/30 hover:bg-base-200/80",
    active:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-100 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-base-200",
  },
};

function ScenarioButton({
  icon: Icon,
  label,
  onClick,
  tone,
  active,
  activeLabel,
  inactiveLabel,
}: {
  icon: typeof Sun;
  label: string;
  onClick: () => void;
  tone: ScenarioTone;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const isOn = active;
  const toneClasses = SCENARIO_TONE_CLASS[tone];
  const stateLabel = isOn ? activeLabel : inactiveLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isOn}
      className={`btn btn-sm gap-2 border font-normal ${
        isOn ? toneClasses.active : toneClasses.idle
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="text-left">
        <span className="block leading-tight">{label}</span>
        <span
          className={`mt-0.5 block text-[10px] font-semibold uppercase tracking-wide ${
            isOn ? "text-current" : "text-base-content/50"
          }`}
        >
          <span
            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${
              isOn ? "bg-current animate-pulse" : "bg-base-content/30"
            }`}
            aria-hidden
          />
          {stateLabel}
        </span>
      </span>
    </button>
  );
}

function MotionReveal({ children }: { children: ReactNode }) {
  return (
    <div className="animate-[reveal_0.55s_cubic-bezier(0.16,1,0.3,1)_both]">{children}</div>
  );
}