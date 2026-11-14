"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildIntradaySamples } from "@/data/intradaySamples";
import { evaluateHealth } from "@/features/rules-engine/evaluateHealth";
import {
  ENVIRONMENT_LABELS,
  MISSION_EVENT_LABELS,
  type AppLocale,
  UI_STRINGS,
  escalationLabel,
  statusLabelForLocale,
} from "@/lib/locale";
import {
  formatIntradayAxis,
  formatMissionTimestamp,
  parseMissionEventCodes,
} from "@/lib/missionTime";
import { statusStyles } from "@/lib/statusColors";
import type { VitalReadings } from "@/types/health";

interface DayReplayDetailProps {
  reading: VitalReadings;
  priorHistory: VitalReadings[];
  locale: AppLocale;
}

export function DayReplayDetail({ reading, priorHistory, locale }: DayReplayDetailProps) {
  const ui = UI_STRINGS[locale];
  const envLabel = ENVIRONMENT_LABELS[locale][reading.environment];
  const evaluation = useMemo(
    () => evaluateHealth(reading, priorHistory, locale),
    [reading, priorHistory, locale]
  );
  const overallStyles = statusStyles(evaluation.overallStatus);
  const events = parseMissionEventCodes(reading.extraMetrics);

  const intraday = useMemo(() => buildIntradaySamples(reading, 24), [reading]);
  const intradayChart = useMemo(
    () =>
      intraday.map((row) => ({
        time: formatIntradayAxis(row.recordedAt, locale),
        systolicBP: row.systolicBP,
        heartRate: row.heartRate,
        bloodSugar: row.bloodSugar,
        radiationMsv: row.radiationMsv,
      })),
    [intraday, locale]
  );

  return (
    <div className="mission-panel mt-4 animate-[reveal_0.45s_cubic-bezier(0.16,1,0.3,1)_both] space-y-4 border border-primary/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mission-section-title text-base">{ui.dayReplayTitle}</p>
          <p className="mt-1 text-sm text-base-content/85">
            {ui.missionDay} {reading.missionDay} ·{" "}
            {formatMissionTimestamp(reading.recordedAt, locale)} UTC
          </p>
          <p className="mt-1 text-sm text-base-content/75">
            {ui.measuredAtEnvironment}: <span className="font-medium">{envLabel}</span>
          </p>
        </div>
        <div
          className={`rounded-field px-3 py-2 text-sm ${overallStyles.bg} ${overallStyles.text}`}
          role="status"
        >
          {evaluation.headline} — {statusLabelForLocale(locale, evaluation.overallStatus)}
        </div>
      </div>

      {events.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-base-content/65">
            {ui.dayEventsLabel}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {events.map((code) => (
              <li key={code} className="badge badge-outline badge-sm">
                {MISSION_EVENT_LABELS[locale][code] ?? code}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-base-content/65">{ui.intradayChartHint}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReplayMiniChart
          title={ui.chartCardio}
          data={intradayChart}
          lines={[
            { key: "systolicBP", name: ui.chartSystolic, color: "#38bdf8" },
            { key: "heartRate", name: ui.chartHeartRate, color: "#a78bfa" },
          ]}
        />
        <ReplayMiniChart
          title={ui.chartRecovery}
          data={intradayChart}
          lines={[{ key: "bloodSugar", name: ui.chartGlucose, color: "#fbbf24" }]}
        />
        <ReplayMiniChart
          title={ui.chartRadiation}
          data={intradayChart}
          lines={[{ key: "radiationMsv", name: ui.vitals.radiationMsv, color: "#f472b6" }]}
        />
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <VitalChip label={ui.vitals.systolicBP} value={`${reading.systolicBP} mmHg`} />
        <VitalChip label={ui.vitals.heartRate} value={`${reading.heartRate} bpm`} />
        <VitalChip label={ui.vitals.bloodSugar} value={`${reading.bloodSugar} mg/dL`} />
        <VitalChip label={ui.vitals.sleepHours} value={`${reading.sleepHours} h`} />
      </div>

      <p className="text-xs text-base-content/65">
        {ui.escalation}: {escalationLabel(locale, evaluation.escalationLevel)}
      </p>
    </div>
  );
}

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field border border-base-300/60 bg-base-100/30 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">
        {label}
      </p>
      <p className="mission-readout text-base-content">{value}</p>
    </div>
  );
}

function ReplayMiniChart({
  title,
  data,
  lines,
}: {
  title: string;
  data: Array<Record<string, string | number | undefined>>;
  lines: { key: string; name: string; color: string }[];
}) {
  return (
    <div className="rounded-field border border-base-300/50 p-3">
      <h4 className="mb-2 text-xs font-medium text-base-content/90">{title}</h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} interval="preserveStartEnd" />
          <YAxis stroke="#94a3b8" fontSize={10} width={32} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={900}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}