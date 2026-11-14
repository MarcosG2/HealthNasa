"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  buildMockMissionHistory,
  cardioDehydrationScenario,
  isolationDriftScenario,
  MOCK_MISSION_HISTORY,
  solarParticleScenario,
} from "@/data/mockMissionHistory";
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
import type { MissionEnvironment, VitalReadings } from "@/types/health";

const LOG_KEY = "healthnasa_mission_logs";

function loadLocale(): AppLocale {
  if (typeof window === "undefined") return "es";
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "en" || raw === "es") return raw;
  } catch {
    /* ignore */
  }
  return "es";
}

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

export function MissionDashboard() {
  const [history, setHistory] = useState<VitalReadings[]>(MOCK_MISSION_HISTORY);
  const [environment, setEnvironment] = useState<MissionEnvironment>("station");
  const [locale, setLocale] = useState<AppLocale>("es");
  const [pendingReactionMs, setPendingReactionMs] = useState<number | undefined>();

  useEffect(() => {
    // Post-mount hydration: SSR uses MOCK_MISSION_HISTORY; client restores saved logs.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
    setHistory(loadLogs());
    setLocale(loadLocale());
  }, []);

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

  const overall = statusStyles(evaluation.overallStatus);

  const appendReading = useCallback((reading: VitalReadings) => {
    setHistory((prev) => {
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

  function applyScenario(reading: VitalReadings) {
    appendReading({ ...reading, environment });
  }

  function resetBaseline() {
    const baseline = buildMockMissionHistory(environment);
    setHistory(baseline);
    saveLogs(baseline);
  }

  function toggleLocale() {
    setLocale((l) => (l === "es" ? "en" : "es"));
  }

  const nextDay = (latest?.missionDay ?? 14) + 1;
  const envLabel = ENVIRONMENT_LABELS[locale][environment];

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <a href="#main-content" className="skip-link">
        {ui.skipToMain}
      </a>
      <header className="border-b border-base-300 bg-base-200/80 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Rocket className="h-8 w-8 text-primary" aria-hidden />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{ui.appTitle}</h1>
              <p className="text-sm text-base-content/80">{ui.appSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleLocale}
              className="btn btn-sm btn-outline gap-2"
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
              className={`badge badge-lg h-auto min-h-10 gap-2 border border-base-300 px-4 py-2 ${overall.bg}`}
            >
              <Radio className={`h-4 w-4 shrink-0 ${overall.text}`} aria-hidden />
              <span className="text-sm font-medium text-base-content">
                {evaluation.headline}
              </span>
              <span className={`text-xs font-semibold uppercase ${overall.text}`}>
                {statusLabelForLocale(locale, evaluation.overallStatus)}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-6xl flex-wrap gap-3">
          <MissionBadge icon={Users} title={ui.artemisProfile}>
            <span>{profile.missionName}</span>
            <span className="text-base-content/50" aria-hidden>
              ·
            </span>
            <span>
              {profile.commanderRole} / {profile.medicalOfficerRole}
            </span>
            <span className="text-base-content/50" aria-hidden>
              ·
            </span>
            <span>{envLabel}</span>
          </MissionBadge>
          <MissionBadge icon={Clock} title={ui.communicationLatency}>
            {envMeta.latencyLabel}
          </MissionBadge>
          <MissionBadge icon={Shield} title={ui.activeEnvironmentRisks}>
            {envMeta.primaryHazards
              .map((h) => HAZARD_DISPLAY[locale][h].title)
              .join(" · ")}
          </MissionBadge>
        </div>
        <p className="mx-auto mt-2 max-w-6xl text-sm text-base-content/75">
          <strong className="font-medium text-base-content">{ui.whyAutonomous}: </strong>
          {envMeta.autonomyNote}
        </p>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8"
      >
        <section className="flex flex-wrap gap-2" aria-labelledby="sim-controls-heading">
          <h2 id="sim-controls-heading" className="sr-only">
            {ui.simulationControls}
          </h2>
          <ScenarioButton
            icon={Sun}
            label={ui.simulateSolarEvent}
            onClick={() => applyScenario(solarParticleScenario(environment))}
            className="border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
          />
          <ScenarioButton
            icon={AlertTriangle}
            label={ui.simulateCardioDehydration}
            onClick={() => applyScenario(cardioDehydrationScenario(environment))}
            className="border-rose-500/50 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
          />
          <ScenarioButton
            icon={Radio}
            label={ui.simulateIsolationDrift}
            onClick={() => applyScenario(isolationDriftScenario(environment))}
            className="border-violet-500/50 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25"
          />
          <ScenarioButton
            icon={RotateCcw}
            label={ui.resetBaseline}
            onClick={resetBaseline}
            className="border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-800"
          />
          <p className="w-full text-sm text-base-content/75 sm:w-auto sm:self-center">
            {ui.missionDay} {latest.missionDay} — {envLabel}
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-2" aria-labelledby="body-systems-heading">
          <div>
            <h2 id="body-systems-heading" className="mb-4 text-lg font-semibold">
              {ui.bodyMapTitle}
            </h2>
            <BodyMap systemStatuses={evaluation.systemStatuses} locale={locale} />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{ui.recommendedActions}</h2>
            <ul className="space-y-3">
              {evaluation.guidance.map((g, i) => (
                <li
                  key={i}
                  className="card card-border bg-base-200/60 p-3 text-sm text-base-content/85"
                >
                  <p className="font-medium text-base-content">{g.whyNeededInSpace}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {g.recommendedActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="text-sm text-base-content/75">
              {ui.escalation}: {escalationLabel(locale, evaluation.escalationLevel)}
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2" aria-label={ui.dailyCountermeasures}>
          <MissionRoutinePanel
            locale={locale}
            onReactionRecorded={(ms) => setPendingReactionMs(ms)}
          />
          <div className="text-sm text-base-content/75">
            <p>{profile.program}</p>
            <p className="mt-2 text-sm">
              {locale === "es"
                ? "La sincronización con Tierra es opcional; la evaluación clínica se ejecuta en el navegador."
                : "Ground sync is optional; clinical evaluation runs entirely in the browser."}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">{ui.missionTimeline}</h2>
          <HealthCharts
            history={history}
            locale={locale}
            onEnvironmentChange={(env) => setEnvironment(env)}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">{ui.logVitals}</h2>
          <VitalsInputForm
            key={`${environment}-${nextDay}`}
            environment={environment}
            missionDay={nextDay}
            locale={locale}
            onSubmit={appendReading}
            pendingReactionMs={pendingReactionMs}
          />
        </section>
      </main>
    </div>
  );
}

function MissionBadge({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Users;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="badge badge-lg h-auto min-h-9 flex-wrap gap-2 border-base-300 bg-base-200/80 px-3 py-2 text-xs text-base-content/85">
      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
      <span className="font-medium text-base-content">{title}:</span>
      {children}
    </div>
  );
}

function ScenarioButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: typeof Sun;
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-sm gap-2 border ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}