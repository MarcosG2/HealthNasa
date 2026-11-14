"use client";

import { useCallback, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { MuscleId } from "@emmorts/body-muscles";
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
import { BodyMuscleChart } from "./BodyMuscleChart";
import { buildBodyMuscleState, muscleIdToBodySystem } from "./buildBodyMuscleState";

type RegionId = BodySystemStatus;

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

  const bodyState = useMemo(
    () => buildBodyMuscleState(systemStatuses, selected),
    [systemStatuses, selected]
  );

  const relatedHazards = NASA_HAZARDS_KNOWLEDGE.filter((h) =>
    h.relatedSystems.includes(selected)
  );

  const onMuscleActivate = useCallback((id: MuscleId) => {
    const system = muscleIdToBodySystem(id);
    if (system) setSelected(system);
  }, []);

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
      <div className="mission-panel p-4">
        <div
          role="radiogroup"
          aria-label={ui.bodyRegionPicker}
          className="mb-3 flex flex-wrap gap-2"
        >
          {REGION_IDS.map((id) => {
            const st = statusBySystem.get(id) ?? "normal";
            const regionLabel = regions[id].label;
            const statusText = statusLabelForLocale(locale, st);
            const isSelected = selected === id;
            const stStyles = statusStyles(st);
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${regionLabel}, ${statusText}${
                  isSelected ? `, ${ui.bodyRegionSelected}` : ""
                }`}
                onClick={() => selectRegion(id)}
                onKeyDown={(e) => onRegionKeyDown(e, id)}
                className={`btn btn-xs sm:btn-sm gap-2 ${
                  isSelected
                    ? `btn-primary ring-2 ring-offset-2 ring-offset-base-200 ${stStyles.ring}`
                    : "btn-outline"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${stStyles.dot}`}
                  aria-hidden
                />
                {regionLabel}
                {isSelected ? (
                  <span className="badge badge-xs border-0 bg-base-100/20 text-[10px] uppercase">
                    {ui.bodyRegionSelected}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <BodyMuscleChart
          bodyState={bodyState}
          ariaLabel={ui.bodyMapAria}
          onMuscleActivate={onMuscleActivate}
        />
        <p className="mt-3 text-center text-sm text-base-content/75">{ui.bodyMapHint}</p>
      </div>

      <div
        className={`mission-panel p-4 ring-2 ${styles.ring} ${styles.bg}`}
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