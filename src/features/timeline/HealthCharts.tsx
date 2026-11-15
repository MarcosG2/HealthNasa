"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MouseHandlerDataParam } from "recharts";
import { RADIATION_CHART_CAUTION_MSV } from "@/data/nasaKnowledge";
import {
  ENVIRONMENT_MISSION_META,
  type AppLocale,
  UI_STRINGS,
} from "@/lib/locale";
import { formatMissionTimestamp } from "@/lib/missionTime";
import type {
  CardioChartScale,
  ChartPanelId,
  DonkiFlareRecord,
  MissionTelemetryArchive,
  RadiationChartScale,
  RecoveryChartScale,
  VitalReadings,
} from "@/types/health";
import {
  CHART_GRID_PROPS,
  CHART_MARGIN,
  MISSION_CHART,
} from "@/lib/chartTheme";
import {
  buildCardioTimeline,
  buildRadiationTimeline,
  buildRecoveryTimeline,
} from "./buildPanelTimelines";
import type { ChartTimelineRow } from "./buildChartTimeline";

interface HealthChartsProps {
  history: VitalReadings[];
  locale?: AppLocale;
  cardioScale: CardioChartScale;
  recoveryScale: RecoveryChartScale;
  radiationScale: RadiationChartScale;
  onCardioScaleChange: (next: CardioChartScale) => void;
  onRecoveryScaleChange: (next: RecoveryChartScale) => void;
  onRadiationScaleChange: (next: RadiationChartScale) => void;
  cardioFocusDay: number | null;
  recoveryFocusDay: number | null;
  radiationFocusDay: number | null;
  onCardioFocusDayChange: (day: number) => void;
  onRecoveryFocusDayChange: (day: number) => void;
  onRadiationFocusDayChange: (day: number) => void;
  missionDayOptions: number[];
  focusHourUtc: number | null;
  latestMissionDay: number;
  selectedRecordedAt?: string | null;
  onSelectPoint?: (reading: VitalReadings, panel: ChartPanelId) => void;
  onLoadArchive?: () => void;
  archiveLoading?: boolean;
  archiveLoaded?: boolean;
  loadArchiveDisabled?: boolean;
  animateLines?: boolean;
  telemetryArchive?: MissionTelemetryArchive | null;
  donkiFlares?: DonkiFlareRecord[];
}

export function HealthCharts({
  history = [],
  locale = "en",
  cardioScale,
  recoveryScale,
  radiationScale,
  onCardioScaleChange,
  onRecoveryScaleChange,
  onRadiationScaleChange,
  cardioFocusDay,
  recoveryFocusDay,
  radiationFocusDay,
  onCardioFocusDayChange,
  onRecoveryFocusDayChange,
  onRadiationFocusDayChange,
  missionDayOptions,
  focusHourUtc,
  latestMissionDay,
  selectedRecordedAt = null,
  onSelectPoint,
  onLoadArchive,
  archiveLoading = false,
  archiveLoaded = false,
  loadArchiveDisabled = false,
  animateLines = true,
  telemetryArchive = null,
  donkiFlares,
}: HealthChartsProps) {
  const ui = UI_STRINGS[locale];
  const effectiveCardioDay =
    cardioScale === "day" ? null : (cardioFocusDay ?? latestMissionDay);
  const effectiveRecoveryDay =
    recoveryScale === "day" ? null : (recoveryFocusDay ?? latestMissionDay);
  const effectiveRadiationDay =
    radiationScale === "day" ? null : (radiationFocusDay ?? latestMissionDay);

  const focusEnv =
    history.find(
      (h) =>
        h.missionDay ===
        (effectiveCardioDay ?? effectiveRadiationDay ?? effectiveRecoveryDay ?? latestMissionDay)
    )?.environment ??
    history[history.length - 1]?.environment ??
    "station";
  const envMeta = ENVIRONMENT_MISSION_META[locale][focusEnv];

  const cardio = useMemo(
    () =>
      buildCardioTimeline({
        history,
        locale,
        focusHourUtc,
        telemetryArchive,
        focusMissionDay: effectiveCardioDay,
        scale: cardioScale,
      }),
    [history, locale, effectiveCardioDay, focusHourUtc, telemetryArchive, cardioScale]
  );
  const recovery = useMemo(
    () =>
      buildRecoveryTimeline({
        history,
        locale,
        focusHourUtc,
        telemetryArchive,
        focusMissionDay: effectiveRecoveryDay,
        scale: recoveryScale,
      }),
    [history, locale, effectiveRecoveryDay, focusHourUtc, telemetryArchive, recoveryScale]
  );
  const radiation = useMemo(
    () =>
      buildRadiationTimeline({
        history,
        locale,
        focusHourUtc,
        telemetryArchive,
        focusMissionDay: effectiveRadiationDay,
        scale: radiationScale,
        donkiFlares,
      }),
    [history, locale, effectiveRadiationDay, focusHourUtc, telemetryArchive, radiationScale, donkiFlares]
  );

  const flareAxisMarkers = useMemo(() => {
    if (!donkiFlares?.length || radiationScale !== "day") return [];
    const labels = new Set(radiation.rows.map((r) => r.axisLabel));
    const markers: { axisLabel: string; classType: string }[] = [];
    for (const row of radiation.rows) {
      const classTag = row.reading.extraMetrics?.donkiFlareClass;
      if (typeof classTag === "string" && labels.has(row.axisLabel)) {
        markers.push({ axisLabel: row.axisLabel, classType: classTag });
      }
    }
    return markers;
  }, [donkiFlares, radiation.rows, radiationScale]);

  const selectedAxisLabel = useMemo(() => {
    if (!selectedRecordedAt) return null;
    const row =
      cardio.rows.find((r) => r.recordedAt === selectedRecordedAt) ??
      recovery.rows.find((r) => r.recordedAt === selectedRecordedAt) ??
      radiation.rows.find((r) => r.recordedAt === selectedRecordedAt);
    return row?.axisLabel ?? null;
  }, [cardio.rows, recovery.rows, radiation.rows, selectedRecordedAt]);

  const resolvedHour = focusHourUtc ?? 0;

  const radiationCautionHour = RADIATION_CHART_CAUTION_MSV / 24;

  const tooltipLabel = (
    _label: ReactNode,
    payload: readonly { payload?: ChartTimelineRow }[]
  ): ReactNode => {
    const row = payload[0]?.payload;
    if (!row) return _label;
    return `${ui.missionDay} ${row.missionDay} · ${formatMissionTimestamp(row.recordedAt, locale)} UTC`;
  };

  function makeClickHandler(panel: ChartPanelId) {
    return (state: MouseHandlerDataParam): void => {
      const rawIndex = state.activeTooltipIndex ?? state.activeIndex;
      const index = typeof rawIndex === "number" ? rawIndex : undefined;
      if (index === undefined) return;
      const data =
        panel === "cardio"
          ? cardio.rows
          : panel === "recovery"
            ? recovery.rows
            : radiation.rows;
      const row = data[index];
      if (row?.reading) onSelectPoint?.(row.reading, panel);
    };
  }

  function selectionMarker(data: ChartTimelineRow[]): ReactElement | null {
    if (selectedAxisLabel === null) return null;
    if (!data.some((r) => r.axisLabel === selectedAxisLabel)) return null;
    return (
      <ReferenceLine
        x={selectedAxisLabel}
        stroke={MISSION_CHART.selection}
        strokeWidth={2}
        strokeDasharray="4 2"
        ifOverflow="extendDomain"
      />
    );
  }

  const activeDot = MISSION_CHART.activeDot;
  const tooltipStyle = MISSION_CHART.tooltip;
  const axisTick = MISSION_CHART.tick;
  const axisTickSm = MISSION_CHART.tickSm;

  return (
    <div className="space-y-6">
      <div className="mission-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-base-content/65">{ui.chartPointHintPanels}</p>
          {cardioScale === "5sec" ? (
            <p className="mt-1 text-xs font-medium text-primary">
              {ui.missionDay} {effectiveCardioDay} · {String(resolvedHour).padStart(2, "0")}:00 UTC
            </p>
          ) : null}
        </div>
        {onLoadArchive ? (
          <button
            type="button"
            className={`btn btn-sm ${
              archiveLoaded ? "btn-ghost border border-base-300/60" : "btn-outline btn-primary"
            }`}
            onClick={onLoadArchive}
            disabled={archiveLoading || archiveLoaded || loadArchiveDisabled}
            aria-busy={archiveLoading}
          >
            {archiveLoading
              ? ui.load30DayArchiveLoading
              : archiveLoaded
                ? ui.load30DayArchiveLoaded
                : ui.load30DayArchive}
          </button>
        ) : null}
      </div>

      <div className="mission-strip space-y-2 rounded-box">
        <p className="mission-section-title text-base">{ui.environmentBrief}</p>
        <p>
          <span className="font-medium text-base-content">{ui.habitatLabel}: </span>
          {envMeta.habitatName}
        </p>
        <p className="text-xs text-base-content/70">{envMeta.scenarioContext}</p>
      </div>

      <ChartPanel
        title={ui.chartCardio}
        hint={hintForCardio(ui, cardioScale, cardio.rows.length === 0)}
        chartKey={`cardio-${cardioScale}-${effectiveCardioDay}-${cardio.rows.length}`}
        scaleGroupLabel={ui.chartTimeScale}
        scales={
          [
            ["day", ui.cardioScaleDay],
            ["minute", ui.cardioScaleMinute],
            ["5sec", ui.cardioScale5sec],
          ] as const
        }
        activeScale={cardioScale}
        onScaleChange={onCardioScaleChange}
        missionDayPicker={
          cardioScale === "minute" || cardioScale === "5sec"
            ? {
                label: ui.chartMissionDayPick,
                value: effectiveCardioDay ?? latestMissionDay,
                days: missionDayOptions,
                onChange: onCardioFocusDayChange,
              }
            : undefined
        }
      >
        {cardio.rows.length === 0 ? (
          <p className="text-sm text-base-content/70">{ui.cardioScaleNeedsDay}</p>
        ) : (
          <ComposedChart
            data={cardio.rows}
            margin={CHART_MARGIN}
            onClick={makeClickHandler("cardio")}
            style={{ cursor: onSelectPoint ? "crosshair" : "default" }}
          >
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis
              dataKey="axisLabel"
              stroke={MISSION_CHART.axis}
              tick={axisTick}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="bp" stroke={MISSION_CHART.axis} tick={axisTickSm} />
            <YAxis
              yAxisId="hr"
              orientation="right"
              stroke={MISSION_CHART.axis}
              tick={axisTickSm}
              domain={[40, 190]}
            />
            <Tooltip labelFormatter={tooltipLabel} contentStyle={tooltipStyle} />
            <Legend />
            {selectionMarker(cardio.rows)}
            {cardioScale === "day" ? (
              <>
                <Area
                  yAxisId="hr"
                  type="monotone"
                  dataKey="heartRateMax"
                  name={ui.chartHeartRateMax}
                  stroke={MISSION_CHART.series.hrMax}
                  fill={MISSION_CHART.series.bandFill}
                  fillOpacity={0.35}
                  dot={false}
                  isAnimationActive={animateLines}
                />
                <Area
                  yAxisId="hr"
                  type="monotone"
                  dataKey="heartRateMin"
                  name={ui.chartHeartRateMin}
                  stroke={MISSION_CHART.series.hrMin}
                  fill={MISSION_CHART.void}
                  fillOpacity={0}
                  dot={false}
                  isAnimationActive={animateLines}
                />
                <Line
                  yAxisId="hr"
                  type="monotone"
                  dataKey="heartRate"
                  name={ui.chartHeartRateAvg}
                  stroke={MISSION_CHART.series.hrAvg}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={activeDot}
                  isAnimationActive={animateLines}
                />
              </>
            ) : (
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="heartRate"
                name={ui.chartHeartRate}
                stroke={MISSION_CHART.series.hrAvg}
                strokeWidth={2}
                dot={false}
                activeDot={activeDot}
                isAnimationActive={animateLines}
              />
            )}
            <Line
              yAxisId="bp"
              type="monotone"
              dataKey="systolicBP"
              name={ui.chartSystolic}
              stroke={MISSION_CHART.series.systolic}
              strokeWidth={2}
              dot={cardioScale === "day" ? { r: 3 } : false}
              activeDot={activeDot}
              isAnimationActive={animateLines}
            />
          </ComposedChart>
        )}
      </ChartPanel>

      <ChartPanel
        title={ui.chartRecovery}
        hint={hintForRecovery(ui, recoveryScale, recovery.rows.length === 0)}
        chartKey={`recovery-${recoveryScale}-${recovery.rows.length}`}
        scaleGroupLabel={ui.chartTimeScale}
        scales={
          [
            ["day", ui.recoveryScaleDay],
            ["hour", ui.recoveryScaleHour],
          ] as const
        }
        activeScale={recoveryScale}
        onScaleChange={onRecoveryScaleChange}
        missionDayPicker={
          recoveryScale === "hour"
            ? {
                label: ui.chartMissionDayPick,
                value: effectiveRecoveryDay ?? latestMissionDay,
                days: missionDayOptions,
                onChange: onRecoveryFocusDayChange,
              }
            : undefined
        }
      >
        {recovery.rows.length === 0 ? (
          <p className="text-sm text-base-content/70">{ui.recoveryScaleNeedsDay}</p>
        ) : (
          <LineChart
            data={recovery.rows}
            margin={CHART_MARGIN}
            onClick={makeClickHandler("recovery")}
            style={{ cursor: onSelectPoint ? "crosshair" : "default" }}
          >
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis
              dataKey="axisLabel"
              stroke={MISSION_CHART.axis}
              tick={axisTick}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="sleep"
              stroke={MISSION_CHART.axis}
              tick={axisTickSm}
              domain={[0, 10]}
            />
            <YAxis yAxisId="met" orientation="right" stroke={MISSION_CHART.axis} tick={axisTickSm} />
            <Tooltip labelFormatter={tooltipLabel} contentStyle={tooltipStyle} />
            <Legend />
            {selectionMarker(recovery.rows)}
            {recoveryScale === "day" ? (
              <>
                <Line
                  yAxisId="sleep"
                  type="monotone"
                  dataKey="sleepHours"
                  name={ui.chartSleep}
                  stroke={MISSION_CHART.series.sleep}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={activeDot}
                  isAnimationActive={animateLines}
                />
                <Line
                  yAxisId="met"
                  type="monotone"
                  dataKey="stressLevel"
                  name={ui.chartStress}
                  stroke={MISSION_CHART.series.glucose}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={activeDot}
                  isAnimationActive={animateLines}
                />
              </>
            ) : (
              <>
                <Line
                  yAxisId="met"
                  type="monotone"
                  dataKey="bloodSugar"
                  name={ui.chartGlucose}
                  stroke={MISSION_CHART.series.stress}
                  strokeWidth={2}
                  dot={false}
                  activeDot={activeDot}
                  isAnimationActive={animateLines}
                />
                <Line
                  yAxisId="met"
                  type="monotone"
                  dataKey="moodScore"
                  name={ui.chartMood}
                  stroke={MISSION_CHART.series.mood}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={activeDot}
                  isAnimationActive={animateLines}
                />
              </>
            )}
          </LineChart>
        )}
      </ChartPanel>

      <ChartPanel
        title={ui.chartRadiation}
        hint={hintForRadiation(ui, radiationScale)}
        chartKey={`radiation-${radiationScale}-${effectiveRadiationDay}-${radiation.rows.length}`}
        scaleGroupLabel={ui.chartTimeScale}
        scales={
          [
            ["day", ui.radiationScaleDay],
            ["hour", ui.radiationScaleHour],
          ] as const
        }
        activeScale={radiationScale}
        onScaleChange={onRadiationScaleChange}
        missionDayPicker={
          radiationScale === "hour"
            ? {
                label: ui.chartMissionDayPick,
                value: effectiveRadiationDay ?? latestMissionDay,
                days: missionDayOptions,
                onChange: onRadiationFocusDayChange,
              }
            : undefined
        }
      >
        {radiation.rows.length === 0 ? (
          <p className="text-sm text-base-content/70">{ui.radiationScaleNeedsDay}</p>
        ) : (
          <LineChart
            data={radiation.rows}
            margin={CHART_MARGIN}
            onClick={makeClickHandler("radiation")}
            style={{ cursor: onSelectPoint ? "crosshair" : "default" }}
          >
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis
              dataKey="axisLabel"
              stroke={MISSION_CHART.axis}
              tick={axisTick}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="dose" stroke={MISSION_CHART.axis} tick={axisTickSm} />
            {radiationScale === "day" ? (
              <YAxis yAxisId="cum" orientation="right" stroke={MISSION_CHART.axis} tick={axisTickSm} />
            ) : null}
            <Tooltip labelFormatter={tooltipLabel} contentStyle={tooltipStyle} />
            <Legend />
            {selectionMarker(radiation.rows)}
            {flareAxisMarkers.map((m) => (
              <ReferenceLine
                key={`flare-${m.axisLabel}-${m.classType}`}
                x={m.axisLabel}
                stroke={MISSION_CHART.series.radiationCum}
                strokeDasharray="2 4"
                strokeWidth={1.5}
                label={{
                  value: `FLR ${m.classType}`,
                  position: "top",
                  fill: MISSION_CHART.series.radiationCum,
                  fontSize: 10,
                }}
              />
            ))}
            <ReferenceLine
              yAxisId="dose"
              y={radiationScale === "day" ? RADIATION_CHART_CAUTION_MSV : radiationCautionHour}
              stroke={MISSION_CHART.series.radiation}
              strokeDasharray="4 4"
            />
            <Line
              yAxisId="dose"
              type="monotone"
              dataKey="radiationMsv"
              name={ui.vitals.radiationMsv}
              stroke={MISSION_CHART.series.hrMax}
              strokeWidth={2}
              dot={radiationScale === "day" ? { r: 3 } : false}
              activeDot={activeDot}
              isAnimationActive={animateLines}
            />
            {radiationScale === "day" ? (
              <Line
                yAxisId="cum"
                type="monotone"
                dataKey="radiationCumulative"
                name={ui.chartRadiationCumulative}
                stroke={MISSION_CHART.series.radiationCum}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={animateLines}
              />
            ) : (
              <Line
                yAxisId="dose"
                type="monotone"
                dataKey="radiationCumulative"
                name={ui.chartRadiationCumulativeDay}
                stroke={MISSION_CHART.series.radiationCum}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={animateLines}
              />
            )}
          </LineChart>
        )}
      </ChartPanel>
    </div>
  );
}

function hintForCardio(
  ui: (typeof UI_STRINGS)[AppLocale],
  scale: CardioChartScale,
  empty: boolean
): string {
  if (empty && scale !== "day") return ui.cardioScaleNeedsDay;
  if (scale === "day") return ui.cardioHintDay;
  if (scale === "minute") return ui.cardioHintMinute;
  return ui.cardioHint5sec;
}

function hintForRecovery(
  ui: (typeof UI_STRINGS)[AppLocale],
  scale: RecoveryChartScale,
  empty: boolean
): string {
  if (empty && scale === "hour") return ui.recoveryScaleNeedsDay;
  return scale === "day" ? ui.recoveryHintDay : ui.recoveryHintHour;
}

function hintForRadiation(
  ui: (typeof UI_STRINGS)[AppLocale],
  scale: RadiationChartScale
): string {
  return scale === "day" ? ui.radiationHintDay : ui.radiationHintHour;
}

interface MissionDayPickerConfig {
  label: string;
  value: number;
  days: number[];
  onChange: (day: number) => void;
}

function ChartPanel<S extends string>({
  title,
  hint,
  chartKey,
  scaleGroupLabel,
  scales,
  activeScale,
  onScaleChange,
  missionDayPicker,
  children,
}: {
  title: string;
  hint: string;
  chartKey: string;
  scaleGroupLabel: string;
  scales: readonly (readonly [S, string])[];
  activeScale: S;
  onScaleChange: (next: S) => void;
  missionDayPicker?: MissionDayPickerConfig;
  children: ReactElement | ReactNode;
}) {
  const isChart = typeof children === "object" && children !== null && "type" in (children as object);
  return (
    <div className="mission-panel space-y-3 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <PanelHeading title={title} hint={hint} />
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {missionDayPicker && missionDayPicker.days.length > 0 ? (
            <label className="flex items-center gap-2 text-xs text-base-content/75">
              <span className="whitespace-nowrap font-medium">{missionDayPicker.label}</span>
              <select
                className="select select-bordered select-xs sm:select-sm max-w-[8rem]"
                value={missionDayPicker.value}
                onChange={(e) => missionDayPicker.onChange(Number(e.target.value))}
              >
                {missionDayPicker.days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div role="group" aria-label={scaleGroupLabel} className="join shrink-0">
            {scales.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`btn btn-xs sm:btn-sm join-item ${
                  activeScale === id ? "btn-primary" : "btn-ghost border border-base-300/60"
                }`}
                aria-pressed={activeScale === id}
                onClick={() => onScaleChange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {isChart ? (
        <ChartContainer key={chartKey}>{children as ReactElement}</ChartContainer>
      ) : (
        children
      )}
    </div>
  );
}

function PanelHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="min-w-0">
      <h3 className="mission-section-title text-sm">{title}</h3>
      <p className="mt-1 text-xs text-base-content/65">{hint}</p>
    </div>
  );
}

function ChartContainer({ children }: { children: ReactElement }) {
  return (
    <div className="mission-chart-well min-h-[200px] sm:min-h-[220px]">
      <ResponsiveContainer width="100%" height={220}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}