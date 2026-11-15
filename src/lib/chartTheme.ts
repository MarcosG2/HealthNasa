/** Telemetry chart tokens aligned with daisyUI `mission` theme (void console). */
export const MISSION_CHART = {
  void: "#161a1f",
  grid: "#2c333d",
  axis: "#8b95a8",
  selection: "#5eb8dc",
  activeDot: {
    r: 6,
    stroke: "#5eb8dc",
    strokeWidth: 2,
    fill: "#161a1f",
  },
  series: {
    hrMax: "#e879a9",
    hrMin: "#34d399",
    hrAvg: "#a78bfa",
    systolic: "#5eb8dc",
    sleep: "#34d399",
    stress: "#fbbf24",
    glucose: "#fb7185",
    mood: "#5eb8dc",
    radiation: "#fbbf24",
    radiationCum: "#fb7185",
    bandFill: "#5eb8dc22",
  },
  tooltip: {
    background: "#161a1f",
    border: "1px solid #3d4654",
    borderRadius: 4,
    color: "#e8ecf4",
    fontSize: 12,
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  },
  tick: {
    fill: "#8b95a8",
    fontSize: 10,
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  },
  tickSm: {
    fill: "#8b95a8",
    fontSize: 12,
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  },
} as const;

export const CHART_GRID_PROPS = {
  strokeDasharray: "2 6",
  stroke: MISSION_CHART.grid,
  vertical: false,
} as const;

export const CHART_MARGIN = { top: 8, right: 12, left: 4, bottom: 4 } as const;