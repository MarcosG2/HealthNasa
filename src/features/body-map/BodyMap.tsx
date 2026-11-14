"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
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

  function selectRegion(id: RegionId) {
    setSelected(id);
  }

  function onRegionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    id: RegionId
  ) {
    const index = REGION_IDS.indexOf(id);
    if (index < 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectRegion(REGION_IDS[(index + 1) % REGION_IDS.length]);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectRegion(REGION_IDS[(index - 1 + REGION_IDS.length) % REGION_IDS.length]);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card card-border bg-base-200/60 p-4">
        <div
          role="radiogroup"
          aria-label={ui.bodyRegionPicker}
          className="mb-3 flex flex-wrap gap-2"
        >
          {REGION_IDS.map((id) => {
            const st = statusBySystem.get(id) ?? "normal";
            const regionLabel = regions[id].label;
            const statusText = statusLabelForLocale(locale, st);
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected === id}
                aria-label={`${regionLabel}, ${statusText}`}
                onClick={() => selectRegion(id)}
                onKeyDown={(e) => onRegionKeyDown(e, id)}
                className={`btn btn-xs sm:btn-sm ${
                  selected === id ? "btn-primary" : "btn-outline"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${statusStyles(st).dot}`}
                  aria-hidden
                />
                {regionLabel}
              </button>
            );
          })}
        </div>

        <svg
          viewBox="0 0 190 440"
          className="mx-auto h-[320px] w-auto"
          aria-hidden
          focusable="false"
        >
          <ellipse cx="95" cy="360" rx="42" ry="55" className="fill-base-300/80" />
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
                className="pointer-events-none transition-all"
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
          />
        </svg>
        <p className="text-center text-sm text-base-content/75">{ui.bodyMapHint}</p>
      </div>

      <div
        className={`card card-border p-4 ring-1 ${styles.ring} ${styles.bg}`}
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden />
          <h3 className="text-lg font-semibold text-base-content">{regionCopy.label}</h3>
          <span className={`ml-auto text-sm font-semibold ${styles.text}`}>
            {statusLabelForLocale(locale, status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-base-content/85">{regionCopy.summary}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-base-content/70">
          {ui.relatedHazards}
        </p>
        <ul className="mt-2 space-y-4 text-sm text-base-content/85">
          {relatedHazards.map((h) => {
            const display = HAZARD_DISPLAY[locale][h.hazard];
            return (
              <li key={h.hazard} className="border-b border-base-300/80 pb-3 last:border-0">
                <span className="font-medium text-base-content">{display.title}</span>
                {" — "}
                {display.shortDescription}
                {h.hrpRisks && h.hrpRisks.length > 0 && (
                  <p className="mt-1 text-xs text-base-content/75">
                    <span className="font-medium text-base-content/90">
                      {ui.hrpRisksLabel}:{" "}
                    </span>
                    {h.hrpRisks.join(" · ")}
                  </p>
                )}
                {h.officialLinks && h.officialLinks.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-base-content/70">
                      {ui.officialReferences}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {h.officialLinks.map((link) => (
                        <li key={link.url}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}