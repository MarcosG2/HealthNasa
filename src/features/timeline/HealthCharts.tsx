"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import type { MissionEnvironment, VitalReadings } from "@/types/health";

const ENVIRONMENTS: { id: MissionEnvironment; label: string }[] = [
  { id: "station", label: "Space station" },
  { id: "spacecraft", label: "Transit spacecraft" },
  { id: "rover", label: "Rover (partial gravity)" },
  { id: "lunar_base", label: "Lunar base" },
];

interface HealthChartsProps {
  history: VitalReadings[];
  onEnvironmentChange?: (env: MissionEnvironment) => void;
}

export function HealthCharts({ history, onEnvironmentChange }: HealthChartsProps) {
  const [environment, setEnvironment] = useState<MissionEnvironment>(
    history[0]?.environment ?? "station"
  );

  const chartData = useMemo(() => {
    const source = history.length
      ? history.filter((h) => h.environment === environment)
      : buildMockMissionHistory(environment);
    return source.map((h) => ({
      day: `D${h.missionDay}`,
      missionDay: h.missionDay,
      systolicBP: h.systolicBP,
      heartRate: h.heartRate,
      sleepHours: h.sleepHours,
      bloodSugar: h.bloodSugar,
      moodScore: h.moodScore,
    }));
  }, [history, environment]);

  function handleEnvChange(env: MissionEnvironment) {
    setEnvironment(env);
    onEnvironmentChange?.(env);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">Mission environment:</span>
        {ENVIRONMENTS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => handleEnvChange(e.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              environment === e.id
                ? "border-sky-500 bg-sky-500/20 text-sky-200"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-200">
          Cardiovascular trend
        </h3>
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
              name="Systolic BP"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="heartRate"
              name="Heart rate"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-200">
          Recovery & metabolic
        </h3>
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
              name="Sleep (h)"
              stroke="#34d399"
              fill="#34d39933"
            />
            <Area
              type="monotone"
              dataKey="bloodSugar"
              name="Blood sugar"
              stroke="#fbbf24"
              fill="#fbbf2433"
            />
          </AreaChart>
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