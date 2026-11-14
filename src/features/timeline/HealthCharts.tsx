"use client";

import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RADIATION_CHART_CAUTION_MSV } from "@/data/nasaKnowledge";
import {
  ENVIRONMENT_MISSION_META,
  type AppLocale,
  UI_STRINGS,
} from "@/lib/locale";
import { formatMissionTimestamp } from "@/lib/missionTime";
import type { ChartTimeGranularity, MissionEnvironment, VitalReadings } from "@/types/health";
import { buildChartTimeline, type ChartTimelineRow } from "./buildChartTimeline";

interface HealthChartsProps {
  history: VitalReadings[];
  locale?: AppLocale;
  environment: MissionEnvironment;
  selectedRecordedAt?: string | null;
  onSelectPoint?: (reading: VitalReadings) => void;
  animateLines?: boolean;
}

export function HealthCharts({
  history,
  locale = "en",
  environment,
  selectedRecordedAt = null,
  onSelectPoint,
  animateLines = true,
}: HealthChartsProps) {
  const ui = UI_STRINGS[locale];
  const envMeta = ENVIRONMENT_MISSION_META[locale][environment];
  const [granularity, setGranularity] = useState<ChartTimeGranularity>("days");

  const { rows: chartData, source } = useMemo(
    () => buildChartTimeline(history, environment, granularity, locale),
    [history, environment, granularity, locale]
  );

  const selectedAxisLabel = useMemo(() => {
    if (!selectedRecordedAt) return null;
    const row = chartData.find((r) => r.recordedAt === selectedRecordedAt);
    return row?.axisLabel ?? null;
  }, [chartData, selectedRecordedAt]);

  const chartKey = `${environment}-${granularity}-${source.length}-${selectedRecordedAt ?? "live"}`;

  const scaleHint =
    granularity === "minutes"
      ? ui.chartScaleHintMinutes
      : granularity === "hours"
        ? ui.chartScaleHintHours
        : ui.chartScaleHintDays;

  const tooltipLabel = (
    _label: ReactNode,
    payload: readonly { payload?: ChartTimelineRow }[]
  ): ReactNode => {
    const row = payload[0]?.payload;
    if (!row) return _label;
    return `${ui.missionDay} ${row.missionDay} · ${formatMissionTimestamp(row.recordedAt, locale)} UTC`;
  };

  const sharedXAxis = (
    <XAxis dataKey="axisLabel" stroke="#94a3b8" fontSize={10} interval="preserveStartEnd" />
  );

  const selectionMarker =
    selectedAxisLabel !== null ? (
      <ReferenceLine
        x={selectedAxisLabel}
        stroke="#22d3ee"
        strokeWidth={2}
        strokeDasharray="4 2"
      />
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-base-content/65">{ui.chartPointHint}</p>
        <div
          className="flex flex-col items-stretch gap-1 sm:items-end"
          role="group"
          aria-label={ui.chartTimeScale}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">
            {ui.chartTimeScale}
          </span>
          <div className="join">
            {(
              [
                ["minutes", ui.chartScaleMinutes],
                ["hours", ui.chartScaleHours],
                ["days", ui.chartScaleDays],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`btn btn-xs join-item ${
                  granularity === id ? "btn-primary" : "btn-ghost border border-base-300/60"
                }`}
                aria-pressed={granularity === id}
                onClick={() => setGranularity(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-base-content/55">{scaleHint}</p>
        </div>
      </div>

      <div className="mission-panel space-y-2 p-4 text-sm text-base-content/85">
        <p className="mission-section-title text-base">{ui.environmentBrief}</p>
        <p>
          <span className="font-medium text-base-content">{ui.habitatLabel}: </span>
          {envMeta.habitatName}
        </p>
        <p>
          <span className="font-medium text-base-content">{ui.operationsLabel}: </span>
          {envMeta.operationsContext}
        </p>
        <p>
          <span className="font-medium text-base-content">{ui.healthFocusLabel}: </span>
          {envMeta.healthFocus}
        </p>
        <p className="text-xs text-base-content/70">{envMeta.scenarioContext}</p>
      </div>

      <div className="mission-panel p-4">
        <h3 className="mb-3 text-sm font-medium">{ui.chartCardio}</h3>
        <ChartContainer>
          <LineChart key={`cardio-${chartKey}`} data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            {sharedXAxis}
            <YAxis yAxisId="bp" stroke="#94a3b8" fontSize={12} />
            <YAxis yAxisId="hr" orientation="right" stroke="#94a3b8" fontSize={12} />
            <Tooltip
              labelFormatter={tooltipLabel}
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Legend />
            {selectionMarker}
            <Line
              yAxisId="bp"
              type="monotone"
              dataKey="systolicBP"
              name={ui.chartSystolic}
              stroke="#38bdf8"
              strokeWidth={2}
              dot={makeClickableDot(onSelectPoint, selectedRecordedAt) as never}
              isAnimationActive={animateLines}
              animationDuration={850}
            />
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="heartRate"
              name={ui.chartHeartRate}
              stroke="#a78bfa"
              strokeWidth={2}
              dot={makeClickableDot(onSelectPoint, selectedRecordedAt, "#a78bfa") as never}
              isAnimationActive={animateLines}
              animationDuration={900}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="mission-panel p-4">
        <h3 className="mb-3 text-sm font-medium">{ui.chartRecovery}</h3>
        <ChartContainer>
          <AreaChart key={`recovery-${chartKey}`} data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            {sharedXAxis}
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              labelFormatter={tooltipLabel}
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Legend />
            {selectionMarker}
            <Area
              type="monotone"
              dataKey="sleepHours"
              name={ui.chartSleep}
              stroke="#34d399"
              fill="#34d39933"
              dot={makeClickableDot(onSelectPoint, selectedRecordedAt, "#34d399") as never}
              isAnimationActive={animateLines}
              animationDuration={850}
            />
            <Area
              type="monotone"
              dataKey="bloodSugar"
              name={ui.chartGlucose}
              stroke="#fbbf24"
              fill="#fbbf2433"
              dot={makeClickableDot(onSelectPoint, selectedRecordedAt, "#fbbf24") as never}
              isAnimationActive={animateLines}
              animationDuration={900}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="mission-panel p-4">
        <h3 className="mb-3 text-sm font-medium">{ui.chartRadiation}</h3>
        <ChartContainer>
          <LineChart key={`radiation-${chartKey}`} data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            {sharedXAxis}
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              labelFormatter={tooltipLabel}
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Legend />
            {selectionMarker}
            <ReferenceLine
              y={RADIATION_CHART_CAUTION_MSV}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              label={{
                value: ui.radiationCautionLine,
                fill: "#fbbf24",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Line
              type="monotone"
              dataKey="radiationMsv"
              name={ui.vitals.radiationMsv}
              stroke="#f472b6"
              strokeWidth={2}
              dot={makeClickableDot(onSelectPoint, selectedRecordedAt, "#f472b6") as never}
              isAnimationActive={animateLines}
              animationDuration={850}
            />
            <Line
              type="monotone"
              dataKey="radiationCumulative"
              name={locale === "es" ? "Acumulado (mSv)" : "Cumulative (mSv)"}
              stroke="#fb7185"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              isAnimationActive={animateLines}
              animationDuration={950}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}

function makeClickableDot(
  onSelectPoint: ((reading: VitalReadings) => void) | undefined,
  selectedRecordedAt: string | null,
  fill = "#38bdf8"
) {
  return function ClickableDot(props: { cx?: number; cy?: number; payload?: ChartTimelineRow }) {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;
    const row = payload;
    const isSelected = selectedRecordedAt === row.recordedAt;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 7 : 4}
        fill={isSelected ? "#22d3ee" : fill}
        stroke="#0f172a"
        strokeWidth={2}
        style={{ cursor: onSelectPoint ? "pointer" : "default" }}
        onClick={(event) => {
          event.stopPropagation();
          onSelectPoint?.(row.reading);
        }}
      />
    );
  };
}

function ChartContainer({ children }: { children: ReactElement }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      {children}
    </ResponsiveContainer>
  );
}