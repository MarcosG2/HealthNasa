"use client";

import { useCallback, useRef, useState } from "react";
import { CheckSquare, Zap } from "lucide-react";
import type { AppLocale } from "@/lib/locale";
import { UI_STRINGS } from "@/lib/locale";

const CHECKLIST_KEY = "healthnasa_daily_checklist";
const POINTS_KEY = "healthnasa_readiness_points";
const REACTION_KEY = "healthnasa_reaction_avg_ms";

const CHECKLIST_IDS = [
  "resistive",
  "hydration",
  "sleep",
  "radiation",
  "cabin",
] as const;

type ChecklistId = (typeof CHECKLIST_IDS)[number];

function emptyChecklist(): Record<ChecklistId, boolean> {
  return {
    resistive: false,
    hydration: false,
    sleep: false,
    radiation: false,
    cabin: false,
  };
}

function readRoutineState(): {
  checked: Record<ChecklistId, boolean>;
  points: number;
  reactionAvg: number | null;
} {
  const checked = emptyChecklist();
  let points = 0;
  let reactionAvg: number | null = null;
  if (typeof window === "undefined") {
    return { checked, points, reactionAvg };
  }
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (raw) {
      Object.assign(checked, JSON.parse(raw) as Record<ChecklistId, boolean>);
    }
    const pts = localStorage.getItem(POINTS_KEY);
    if (pts) points = parseInt(pts, 10) || 0;
    const rx = localStorage.getItem(REACTION_KEY);
    if (rx) reactionAvg = parseInt(rx, 10) || null;
  } catch {
    /* offline / private mode */
  }
  return { checked, points, reactionAvg };
}

interface MissionRoutinePanelProps {
  locale?: AppLocale;
  onReactionRecorded?: (averageMs: number) => void;
}

export function MissionRoutinePanel({
  locale = "en",
  onReactionRecorded,
}: MissionRoutinePanelProps) {
  const ui = UI_STRINGS[locale];

  const checklistLabels: Record<ChecklistId, string> = {
    resistive: ui.checklistResistiveExercise,
    hydration: ui.checklistHydration,
    sleep: ui.checklistSleep,
    radiation: ui.checklistRadiation,
    cabin: ui.checklistCabin,
  };

  const [routineSeed] = useState(readRoutineState);
  const [checked, setChecked] = useState<Record<ChecklistId, boolean>>(routineSeed.checked);
  const [points, setPoints] = useState(routineSeed.points);
  const [reactionAvg, setReactionAvg] = useState<number | null>(routineSeed.reactionAvg);

  const [reactionPhase, setReactionPhase] = useState<
    "idle" | "waiting" | "go" | "done"
  >("idle");
  const [trial, setTrial] = useState(0);
  const [trialTimes, setTrialTimes] = useState<number[]>([]);
  const goAtRef = useRef<number | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistChecklist = useCallback(
    (next: Record<ChecklistId, boolean>, nextPoints: number) => {
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
        localStorage.setItem(POINTS_KEY, String(nextPoints));
      } catch {
        /* ignore */
      }
    },
    []
  );

  function toggleItem(id: ChecklistId) {
    setChecked((prev) => {
      const wasOn = prev[id];
      const next = { ...prev, [id]: !wasOn };
      const delta = wasOn ? -10 : 10;
      setPoints((p) => {
        const nextPoints = Math.max(0, p + delta);
        persistChecklist(next, nextPoints);
        return nextPoints;
      });
      return next;
    });
  }

  function startReactionTest() {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    setTrial(0);
    setTrialTimes([]);
    setReactionPhase("waiting");
    scheduleGoSignal();
  }

  function scheduleGoSignal() {
    const delay = 1200 + Math.random() * 2200;
    waitTimerRef.current = setTimeout(() => {
      goAtRef.current = performance.now();
      setReactionPhase("go");
    }, delay);
  }

  function onReactionTap() {
    if (reactionPhase === "waiting") {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      setReactionPhase("idle");
      return;
    }
    if (reactionPhase !== "go" || goAtRef.current === null) return;

    const elapsed = Math.round(performance.now() - goAtRef.current);
    const nextTimes = [...trialTimes, elapsed];
    setTrialTimes(nextTimes);
    goAtRef.current = null;

    if (nextTimes.length >= 3) {
      const avg = Math.round(
        nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length
      );
      setReactionAvg(avg);
      setReactionPhase("done");
      try {
        localStorage.setItem(REACTION_KEY, String(avg));
      } catch {
        /* ignore */
      }
      onReactionRecorded?.(avg);
    } else {
      setTrial(nextTimes.length);
      setReactionPhase("waiting");
      scheduleGoSignal();
    }
  }

  const completedCount = CHECKLIST_IDS.filter((id) => checked[id]).length;
  const progressPct = (completedCount / CHECKLIST_IDS.length) * 100;

  const targetColor =
    reactionPhase === "go"
      ? "bg-emerald-500 border-emerald-300"
      : reactionPhase === "waiting"
        ? "bg-amber-500/40 border-amber-400"
        : "bg-slate-700 border-slate-600";

  return (
    <div className="mission-panel p-4">
      <div className="flex items-center justify-between text-sm text-base-content/80">
        <span>{ui.readinessPoints}</span>
        <span className="font-medium text-success">{points}</span>
      </div>
      <progress
        className="progress progress-success mt-2 w-full"
        value={progressPct}
        max={100}
        aria-label={`${ui.readinessPoints}: ${completedCount} ${ui.of} ${CHECKLIST_IDS.length}`}
      />
      <ul className="mt-4 space-y-2">
        {CHECKLIST_IDS.map((id) => (
          <li key={id}>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked[id]}
                onChange={() => toggleItem(id)}
                className="checkbox checkbox-sm checkbox-success"
              />
              <CheckSquare className="h-4 w-4 text-base-content/60" aria-hidden />
              {checklistLabels[id]}
            </label>
          </li>
        ))}
      </ul>

      <div className="divider my-6" />

      <h4 className="flex items-center gap-2 text-base font-semibold">
        <Zap className="h-4 w-4 text-primary" aria-hidden />
        {ui.reactionTest}
      </h4>
      <p className="mt-1 text-sm text-base-content/75">{ui.reactionTestHint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {reactionPhase === "idle" || reactionPhase === "done" ? (
          <button type="button" onClick={startReactionTest} className="btn btn-primary btn-sm">
            {ui.reactionStart}
          </button>
        ) : (
          <button
            type="button"
            onClick={onReactionTap}
            aria-label={
              reactionPhase === "waiting" ? ui.reactionWait : ui.reactionTap
            }
            className={`btn flex h-20 w-20 min-h-20 items-center justify-center rounded-box border-2 text-xs ${targetColor}`}
          >
            {reactionPhase === "waiting"
              ? ui.reactionWait
              : ui.reactionTap}
          </button>
        )}
        {trial > 0 && reactionPhase !== "done" && (
          <span className="text-xs text-base-content/75">
            {ui.stepOf} {trial + 1} {ui.of} 3
          </span>
        )}
        {reactionAvg !== null && (
          <p className="text-sm" role="status" aria-live="polite">
            {ui.reactionResult}: <strong>{reactionAvg}</strong>
          </p>
        )}
      </div>
    </div>
  );
}