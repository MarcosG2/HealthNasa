import type { AppLocale } from "@/lib/locale";

/** Mission-clock label with day + time (includes seconds for chart tooltips). */
export function formatMissionTimestamp(iso: string, locale: AppLocale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale === "es" ? "es-ES" : "en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatIntradayAxis(iso: string, locale: AppLocale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(locale === "es" ? "es-ES" : "en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDayAxis(day: number, iso: string, locale: AppLocale): string {
  const time = formatIntradayAxis(iso, locale);
  return locale === "es" ? `D${day} ${time}` : `D${day} ${time}`;
}

export function parseMissionEventCodes(
  extra: Record<string, number | string> | undefined
): string[] {
  if (!extra?.missionEvents) return [];
  const raw = extra.missionEvents;
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}