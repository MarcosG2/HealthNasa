"use client";

import { useMemo, useState } from "react";
import { NASA_HAZARDS_KNOWLEDGE } from "@/data/nasaKnowledge";
import { statusLabel, statusStyles } from "@/lib/statusColors";
import type { BodySystemStatus, HealthStatus, SystemStatusEntry } from "@/types/health";

type RegionId = BodySystemStatus;

const REGIONS: {
  id: RegionId;
  label: string;
  functionSummary: string;
  path: string;
}[] = [
  {
    id: "neuro_behavioral",
    label: "Head / neuro-behavioral",
    functionSummary: "Sleep, mood, focus, and stress regulation.",
    path: "M 95 28 C 70 28 55 50 55 78 C 55 108 70 128 95 128 C 120 128 135 108 135 78 C 135 50 120 28 95 28 Z",
  },
  {
    id: "cardiovascular",
    label: "Heart / cardiovascular",
    functionSummary: "Blood pressure, heart rate, and circulation.",
    path: "M 88 132 C 75 132 68 155 72 175 C 76 195 88 210 95 218 C 102 210 114 195 118 175 C 122 155 115 132 102 132 Z",
  },
  {
    id: "metabolic",
    label: "Abdomen / metabolic",
    functionSummary: "Glucose, temperature, and energy balance.",
    path: "M 72 218 C 68 235 65 265 68 295 C 72 320 82 335 95 338 C 108 335 118 320 122 295 C 125 265 122 235 118 218 Z",
  },
  {
    id: "immune_musculoskeletal",
    label: "Limbs / immune & musculoskeletal",
    functionSummary: "Strength, radiation exposure effects, and recovery.",
    path: "M 48 140 L 35 280 M 142 140 L 155 280 M 78 338 L 70 420 M 112 338 L 120 420",
  },
];

interface BodyMapProps {
  systemStatuses: SystemStatusEntry[];
}

export function BodyMap({ systemStatuses }: BodyMapProps) {
  const statusBySystem = useMemo(() => {
    const m = new Map<BodySystemStatus, HealthStatus>();
    for (const s of systemStatuses) m.set(s.system, s.status);
    return m;
  }, [systemStatuses]);

  const [selected, setSelected] = useState<RegionId>("cardiovascular");
  const region = REGIONS.find((r) => r.id === selected) ?? REGIONS[0];
  const status = statusBySystem.get(selected) ?? "normal";
  const styles = statusStyles(status);

  const relatedHazards = NASA_HAZARDS_KNOWLEDGE.filter((h) =>
    h.relatedSystems.includes(selected)
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <svg
          viewBox="0 0 190 440"
          className="mx-auto h-[320px] w-auto"
          role="img"
          aria-label="Interactive human body map"
        >
          <ellipse cx="95" cy="360" rx="42" ry="55" className="fill-slate-800/80" />
          {REGIONS.filter((r) => r.id !== "immune_musculoskeletal").map((r) => {
            const st = statusBySystem.get(r.id) ?? "normal";
            const fill =
              st === "critical"
                ? "#fb7185"
                : st === "warning"
                  ? "#fbbf24"
                  : "#34d399";
            const active = selected === r.id;
            return (
              <path
                key={r.id}
                d={r.path}
                fill={fill}
                fillOpacity={active ? 0.55 : 0.35}
                stroke={active ? "#e2e8f0" : "#475569"}
                strokeWidth={active ? 2.5 : 1.5}
                className="cursor-pointer transition-all"
                onClick={() => setSelected(r.id)}
              />
            );
          })}
          {REGIONS.filter((r) => r.id === "immune_musculoskeletal").map((r) => (
            <path
              key={r.id}
              d={r.path}
              fill="none"
              stroke={
                (statusBySystem.get(r.id) ?? "normal") === "critical"
                  ? "#fb7185"
                  : (statusBySystem.get(r.id) ?? "normal") === "warning"
                    ? "#fbbf24"
                    : "#34d399"
              }
              strokeWidth={selected === r.id ? 3 : 2}
              strokeLinecap="round"
              className="cursor-pointer"
              onClick={() => setSelected(r.id)}
            />
          ))}
        </svg>
        <p className="text-center text-xs text-slate-500">
          Tap a body region to see status and related space hazards.
        </p>
      </div>

      <div className={`rounded-xl border border-slate-800 p-4 ring-1 ${styles.ring} ${styles.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
          <h3 className="text-lg font-semibold text-slate-100">{region.label}</h3>
          <span className={`ml-auto text-sm font-medium ${styles.text}`}>
            {statusLabel(status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300">{region.functionSummary}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Related NASA spaceflight hazards
        </p>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          {relatedHazards.map((h) => (
            <li key={h.hazard}>
              <span className="font-medium text-slate-100">{h.title}</span>
              {" — "}
              {h.shortDescription}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}