"use client";

import type { ReactElement } from "react";
import { ExternalLink, Sun } from "lucide-react";
import { type AppLocale, UI_STRINGS } from "@/lib/locale";
import type { DonkiFlareFeedResponse } from "@/types/health";

interface SolarFlareAlertCardProps {
  feed: DonkiFlareFeedResponse | null;
  locale: AppLocale;
}

const severityStyles = {
  watch: "border-amber-500/50 bg-amber-500/10 text-amber-100",
  warning: "border-amber-400/60 bg-amber-500/15 text-amber-50",
  critical: "border-rose-500/60 bg-rose-500/15 text-rose-50",
} as const;

const sourceLabelKey = {
  nasa_donki_api: "donkiSourceNasa",
  ccmc_donki_api: "donkiSourceCcmc",
  mock_ground_api: "donkiSourceMock",
} as const;

export function SolarFlareAlertCard({
  feed,
  locale,
}: SolarFlareAlertCardProps): ReactElement | null {
  const ui = UI_STRINGS[locale];

  if (!feed) return null;

  const sourceKey = sourceLabelKey[feed.source];
  const sourceLabel = ui[sourceKey];

  if (!feed.alert.active || !feed.alert.peakFlare) {
    return (
      <div
        className="mission-panel border border-slate-800 bg-slate-950/80 p-4"
        role="status"
      >
        <div className="flex items-start gap-3">
          <Sun className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-slate-100">{ui.donkiQuietTitle}</p>
            <p className="text-xs text-slate-400">{ui.donkiQuietBody}</p>
            <p className="text-xs text-slate-500">
              {ui.donkiDataSource}:{" "}
              <span className="text-emerald-400/90">{sourceLabel}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const severity = feed.alert.severity;
  const tone =
    severity === "critical"
      ? severityStyles.critical
      : severity === "warning"
        ? severityStyles.warning
        : severityStyles.watch;

  const flare = feed.alert.peakFlare;
  const severityLabel =
    severity === "critical"
      ? ui.donkiSeverityCritical
      : severity === "warning"
        ? ui.donkiSeverityWarning
        : ui.donkiSeverityWatch;

  return (
    <div
      className={`mission-panel border p-4 ${tone}`}
      role="alert"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Sun className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
              {ui.donkiAlertTitle} · {severityLabel}
            </p>
            <p className="text-sm font-medium">{feed.alert.headline}</p>
            <p className="text-xs opacity-90">{ui.donkiAlertWhy}</p>
            <dl className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
              <div>
                <dt className="opacity-70">{ui.donkiClassLabel}</dt>
                <dd className="mission-readout font-semibold">{flare.classType}</dd>
              </div>
              <div>
                <dt className="opacity-70">{ui.donkiRegionLabel}</dt>
                <dd>{flare.sourceLocation ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 text-xs sm:items-end">
          <span className="rounded-field border border-white/10 px-2 py-1 text-slate-300">
            {ui.donkiDataSource}: {sourceLabel}
          </span>
          {flare.link ? (
            <a
              href={flare.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {ui.donkiViewEvent}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}