"use client";

import { useMemo, type ReactElement } from "react";
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
import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import {
  ENVIRONMENT_MISSION_META,
  type AppLocale,
  UI_STRINGS,
} from "@/lib/locale";
import type { MissionEnvironment, VitalReadings } from "@/types/health";

interface HealthChartsProps {
  history: VitalReadings[];
  locale?: AppLocale;
  environment: MissionEnvironment;
}

export function HealthCharts({
  history,
  locale = "en",
  environment,
}: HealthChartsProps) {
  const ui = UI_STRINGS[locale];
  const envMeta = ENVIRONMENT_MISSION_META[locale][environment];

  const chartData = useMemo(() => {
    const filtered = history.filter((h) => h.environment === environment);
    const source =
      filtered.length >= 10 ? filtered : buildMockMissionHistory(environment);
    return source.map((h, index) => {
      const dose = h.radiationMsv ?? 0;
      const cumulative = source
        .slice(0, index + 1)
        .reduce((acc, row) => acc + (row.radiationMsv ?? 0), 0);
      return {
        day: `D${h.missionDay}`,
        missionDay: h.missionDay,
        systolicBP: h.systolicBP,
        heartRate: h.heartRate,
        sleepHours: h.sleepHours,
        bloodSugar: h.bloodSugar,
        moodScore: h.moodScore,
        radiationMsv: dose,
        radiationCumulative: Math.round(cumulative * 100) / 100,
      };
    });
  }, [history, environment]);

  return (
    <div className="space-y-6">
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
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis yAxisId="bp" stroke="#94a3b8" fontSize={12} />
            <YAxis yAxisId="hr" orientation="right" stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Legend />
            <Line
              yAxisId="bp"
              type="monotone"
              dataKey="systolicBP"
              name={ui.chartSystolic}
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="heartRate"
              name={ui.chartHeartRate}
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="mission-panel p-4">
        <h3 className="mb-3 text-sm font-medium">{ui.chartRecovery}</h3>
        <ChartContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="sleepHours"
              name={ui.chartSleep}
              stroke="#34d399"
              fill="#34d39933"
            />
            <Area
              type="monotone"
              dataKey="bloodSugar"
              name={ui.chartGlucose}
              stroke="#fbbf24"
              fill="#fbbf2433"
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="mission-panel p-4">
        <h3 className="mb-3 text-sm font-medium">{ui.chartRadiation}</h3>
        <ChartContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Legend />
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
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="radiationCumulative"
              name={locale === "es" ? "Acumulado (mSv)" : "Cumulative (mSv)"}
              stroke="#fb7185"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}

function ChartContainer({ children }: { children: ReactElement }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      {children}
    </ResponsiveContainer>
  );
}