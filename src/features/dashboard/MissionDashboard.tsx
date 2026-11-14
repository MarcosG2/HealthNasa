"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Languages, Radio, Rocket } from "lucide-react";
import {
  CRITICAL_SCENARIO_READING,
  MOCK_MISSION_HISTORY,
} from "@/data/mockMissionHistory";
import { BodyMap } from "@/features/body-map/BodyMap";
import { evaluateHealth } from "@/features/rules-engine/evaluateHealth";
import { HealthCharts } from "@/features/timeline/HealthCharts";
import { VitalsInputForm } from "@/features/vitals-form/VitalsInputForm";
import {
  ENVIRONMENT_LABELS,
  LOCALE_STORAGE_KEY,
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
  const [history, setHistory] = useState<VitalReadings[]>(loadLogs);
  const [environment, setEnvironment] = useState<MissionEnvironment>("station");
  const [locale, setLocale] = useState<AppLocale>("es");

  useEffect(() => {
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
      return next;
    });
  }, []);

  function simulateCritical() {
    appendReading(CRITICAL_SCENARIO_READING);
  }

  function toggleLocale() {
    setLocale((l) => (l === "es" ? "en" : "es"));
  }

  const nextDay = (latest?.missionDay ?? 14) + 1;
  const envLabel = ENVIRONMENT_LABELS[locale][environment];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Rocket className="h-8 w-8 text-sky-400" aria-hidden />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{ui.appTitle}</h1>
              <p className="text-sm text-slate-400">{ui.appSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleLocale}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100"
              aria-label={
                locale === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish"
              }
            >
              <Languages className="h-4 w-4" aria-hidden />
              {ui.switchToEnglish}
            </button>
            <div
              className={`flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 ${overall.bg}`}
            >
              <Radio className={`h-4 w-4 ${overall.text}`} />
              <span className="text-sm font-medium">{evaluation.headline}</span>
              <span className={`text-xs uppercase ${overall.text}`}>
                {statusLabelForLocale(locale, evaluation.overallStatus)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8">
        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={simulateCritical}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/50 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/25"
          >
            <AlertTriangle className="h-4 w-4" />
            {ui.simulateCritical}
          </button>
          <p className="self-center text-sm text-slate-500">
            {ui.missionDay} {latest.missionDay} — {envLabel}
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <BodyMap systemStatuses={evaluation.systemStatuses} locale={locale} />
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{ui.recommendedActions}</h2>
            <ul className="space-y-3">
              {evaluation.guidance.map((g, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300"
                >
                  <p className="text-slate-100">{g.whyNeededInSpace}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {g.recommendedActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              {ui.escalation}: {escalationLabel(locale, evaluation.escalationLevel)}
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
            environment={environment}
            missionDay={nextDay}
            locale={locale}
            onSubmit={appendReading}
          />
        </section>
      </main>
    </div>
  );
}