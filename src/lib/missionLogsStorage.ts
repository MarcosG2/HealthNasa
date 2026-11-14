import { missionLogEventsForDay } from "@/data/intradaySamples";
import { MOCK_MISSION_HISTORY } from "@/data/mockMissionHistory";
import type { VitalReadings } from "@/types/health";

export const LOG_KEY = "healthnasa_mission_logs_v2";
const LOG_KEY_LEGACY = "healthnasa_mission_logs";

function enrichLogRow(row: VitalReadings): VitalReadings {
  const events = row.extraMetrics?.missionEvents;
  if (typeof events === "string" && events.trim().length > 0) return row;
  return {
    ...row,
    extraMetrics: {
      ...row.extraMetrics,
      missionEvents: missionLogEventsForDay(row.missionDay, row.environment),
    },
  };
}

export function loadMissionLogs(): VitalReadings[] {
  if (typeof window === "undefined") return MOCK_MISSION_HISTORY;
  try {
    const v2 = localStorage.getItem(LOG_KEY);
    if (v2) {
      const parsed = JSON.parse(v2) as VitalReadings[];
      if (parsed.length) return parsed.map(enrichLogRow);
    }
    const legacy = localStorage.getItem(LOG_KEY_LEGACY);
    if (legacy) {
      const parsed = (JSON.parse(legacy) as VitalReadings[]).map(enrichLogRow);
      if (parsed.length) {
        localStorage.setItem(LOG_KEY, JSON.stringify(parsed));
        localStorage.removeItem(LOG_KEY_LEGACY);
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return MOCK_MISSION_HISTORY;
}

export function saveMissionLogs(logs: VitalReadings[]): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {
    /* ignore */
  }
}