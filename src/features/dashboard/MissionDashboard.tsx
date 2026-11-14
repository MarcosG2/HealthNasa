"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Radio, Rocket } from "lucide-react";
import {
  CRITICAL_SCENARIO_READING,
  MOCK_MISSION_HISTORY,
} from "@/data/mockMissionHistory";
import { BodyMap } from "@/features/body-map/BodyMap";
import { evaluateHealth } from "@/features/rules-engine/evaluateHealth";
import { HealthCharts } from "@/features/timeline/HealthCharts";
import { VitalsInputForm } from "@/features/vitals-form/VitalsInputForm";
import { statusLabel, statusStyles } from "@/lib/statusColors";
import type { MissionEnvironment, VitalReadings } from "@/types/health";

const LOG_KEY = "healthnasa_mission_logs";

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

  const latest = history[history.length - 1] ?? MOCK_MISSION_HISTORY[MOCK_MISSION_HISTORY.length - 1];
  const evaluation = useMemo(
    () => evaluateHealth(latest, history.slice(0, -1)),
    [latest, history]
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

  const nextDay = (latest?.missionDay ?? 14) + 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Rocket className="h-8 w-8 text-sky-400" aria-hidden />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mission Health Control</h1>
              <p className="text-sm text-slate-400">
                NASA Space Apps — astronaut monitoring (offline-first)
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 ${overall.bg}`}
          >
            <Radio className={`h-4 w-4 ${overall.text}`} />
            <span className="text-sm font-medium">{evaluation.headline}</span>
            <span className={`text-xs uppercase ${overall.text}`}>
              {statusLabel(evaluation.overallStatus)}
            </span>
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
            Simulate critical scenario
          </button>
          <p className="text-sm text-slate-500 self-center">
            Day {latest.missionDay} — {environment.replace("_", " ")}
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <BodyMap systemStatuses={evaluation.systemStatuses} />
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recommended actions</h2>
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
              Escalation: {evaluation.escalationLevel.replace(/_/g, " ")}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Mission timeline</h2>
          <HealthCharts
            history={history}
            onEnvironmentChange={(env) => setEnvironment(env)}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Log vitals</h2>
          <VitalsInputForm
            environment={environment}
            missionDay={nextDay}
            onSubmit={appendReading}
          />
        </section>
      </main>
    </div>
  );
}