"use client";

import { useMemo, useState } from "react";
import { NASA_HAZARDS_KNOWLEDGE } from "@/data/nasaKnowledge";
import {
  BODY_REGION_COPY,
  HAZARD_DISPLAY,
  statusLabelForLocale,
  type AppLocale,
  UI_STRINGS,
} from "@/lib/locale";
import { statusStyles } from "@/lib/statusColors";
import type { BodySystemStatus, HealthStatus, SystemStatusEntry } from "@/types/health";

type RegionId = BodySystemStatus;

const REGION_PATHS: Record<RegionId, string> = {
  neuro_behavioral:
    "M 95 28 C 70 28 55 50 55 78 C 55 108 70 128 95 128 C 120 128 135 108 135 78 C 135 50 120 28 95 28 Z",
  cardiovascular:
    "M 88 132 C 75 132 68 155 72 175 C 76 195 88 210 95 218 C 102 210 114 195 118 175 C 122 155 115 132 102 132 Z",
  metabolic:
    "M 72 218 C 68 235 65 265 68 295 C 72 320 82 335 95 338 C 108 335 118 320 122 295 C 125 265 122 235 118 218 Z",
  immune_musculoskeletal:
    "M 48 140 L 35 280 M 142 140 L 155 280 M 78 338 L 70 420 M 112 338 L 120 420",
};

const REGION_IDS: RegionId[] = [
  "neuro_behavioral",
  "cardiovascular",
  "metabolic",
  "immune_musculoskeletal",
];

interface BodyMapProps {
  systemStatuses: SystemStatusEntry[];
  locale?: AppLocale;
}

export function BodyMap({ systemStatuses, locale = "es" }: BodyMapProps) {
  const ui = UI_STRINGS[locale];
  const regions = BODY_REGION_COPY[locale];

  const statusBySystem = useMemo(() => {
    const m = new Map<BodySystemStatus, HealthStatus>();
    for (const s of systemStatuses) m.set(s.system, s.status);
    return m;
  }, [systemStatuses]);

  const [selected, setSelected] = useState<RegionId>("cardiovascular");
  const regionCopy = regions[selected];
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
          aria-label={ui.bodyMapAria}
        >
          <ellipse cx="95" cy="360" rx="42" ry="55" className="fill-slate-800/80" />
          {REGION_IDS.filter((id) => id !== "immune_musculoskeletal").map((id) => {
            const st = statusBySystem.get(id) ?? "normal";
            const fill =
              st === "critical"
                ? "#fb7185"
                : st === "warning"
                  ? "#fbbf24"
                  : "#34d399";
            const active = selected === id;
            return (
              <path
                key={id}
                d={REGION_PATHS[id]}
                fill={fill}
                fillOpacity={active ? 0.55 : 0.35}
                stroke={active ? "#e2e8f0" : "#475569"}
                strokeWidth={active ? 2.5 : 1.5}
                className="cursor-pointer transition-all"
                onClick={() => setSelected(id)}
              />
            );
          })}
          <path
            d={REGION_PATHS.immune_musculoskeletal}
            fill="none"
            stroke={
              (statusBySystem.get("immune_musculoskeletal") ?? "normal") === "critical"
                ? "#fb7185"
                : (statusBySystem.get("immune_musculoskeletal") ?? "normal") === "warning"
                  ? "#fbbf24"
                  : "#34d399"
            }
            strokeWidth={selected === "immune_musculoskeletal" ? 3 : 2}
            strokeLinecap="round"
            className="cursor-pointer"
            onClick={() => setSelected("immune_musculoskeletal")}
          />
        </svg>
        <p className="text-center text-xs text-slate-500">{ui.bodyMapHint}</p>
      </div>

      <div className={`rounded-xl border border-slate-800 p-4 ring-1 ${styles.ring} ${styles.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
          <h3 className="text-lg font-semibold text-slate-100">{regionCopy.label}</h3>
          <span className={`ml-auto text-sm font-medium ${styles.text}`}>
            {statusLabelForLocale(locale, status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300">{regionCopy.summary}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          {ui.relatedHazards}
        </p>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          {relatedHazards.map((h) => {
            const display = HAZARD_DISPLAY[locale][h.hazard];
            return (
              <li key={h.hazard}>
                <span className="font-medium text-slate-100">{display.title}</span>
                {" — "}
                {display.shortDescription}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}