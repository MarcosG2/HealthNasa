import type { MentalHealthSurveySubmission } from "@/types/health";

export const MENTAL_HEALTH_LOG_KEY = "healthnasa_mental_health_surveys_v1";
export const MEMORY_GAME_LOG_KEY = "healthnasa_memory_game_results_v1";

export function loadMentalHealthSubmissions(): MentalHealthSurveySubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MENTAL_HEALTH_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MentalHealthSurveySubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMentalHealthSubmissions(
  submissions: MentalHealthSurveySubmission[]
): void {
  try {
    localStorage.setItem(MENTAL_HEALTH_LOG_KEY, JSON.stringify(submissions));
  } catch {
    /* ignore */
  }
}

export async function syncMentalHealthSubmission(
  submission: MentalHealthSurveySubmission
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch("/api/mental-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    return { ok: Boolean(data.ok), message: data.message };
  } catch {
    return { ok: false, message: "Offline — saved on this device only." };
  }
}