import { evaluateHealth } from "@/features/rules-engine/evaluateHealth";
import type { MockAstronautProfile, MissionScenarioId, VitalReadings } from "@/types/health";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function rowToCsvLine(cells: (string | number | boolean | undefined)[]): string {
  return cells
    .map((c) => {
      if (c === undefined || c === null) return "";
      if (typeof c === "boolean") return c ? "true" : "false";
      return csvEscape(String(c));
    })
    .join(",");
}

export function buildTelemetryCsv(
  logs: VitalReadings[],
  astronaut: MockAstronautProfile,
  activeScenarios: MissionScenarioId[]
): string {
  const window = [...logs].sort((a, b) => a.missionDay - b.missionDay).slice(-14);
  const headers = [
    "astronaut_id",
    "call_sign",
    "full_name",
    "agency",
    "role",
    "mission_day",
    "recorded_at_utc",
    "environment",
    "systolic_bp_mmhg",
    "diastolic_bp_mmhg",
    "heart_rate_bpm",
    "blood_sugar_mg_dl",
    "temperature_c",
    "sleep_hours",
    "mood_score_1_5",
    "stress_level_1_10",
    "radiation_msv",
    "reaction_time_ms",
    "overall_status",
    "escalation_level",
    "headline",
    "mission_events",
    "active_scenarios",
    "has_visual_attachment",
  ];

  const lines = [rowToCsvLine(headers)];
  for (const row of window) {
    const prior = window.filter((r) => r.missionDay < row.missionDay);
    const evaluation = evaluateHealth(row, prior, "en");
    const events =
      typeof row.extraMetrics?.missionEvents === "string"
        ? row.extraMetrics.missionEvents.replace(/,/g, "|")
        : "";
    const reaction = row.extraMetrics?.reactionTimeMs;
    lines.push(
      rowToCsvLine([
        astronaut.id,
        astronaut.callSign,
        astronaut.fullName,
        astronaut.agency,
        astronaut.role,
        row.missionDay,
        row.recordedAt,
        row.environment,
        row.systolicBP,
        row.diastolicBP,
        row.heartRate,
        row.bloodSugar,
        row.temperature,
        row.sleepHours,
        row.moodScore,
        row.stressLevel,
        row.radiationMsv,
        typeof reaction === "number"
          ? reaction
          : typeof reaction === "string"
            ? reaction
            : undefined,
        evaluation.overallStatus,
        evaluation.escalationLevel,
        evaluation.headline,
        events,
        activeScenarios.join("|"),
        Boolean(row.imageNoteOrDataUrl?.startsWith("data:image")),
      ])
    );
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadTelemetryCsv(
  csv: string,
  filename: string
): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}