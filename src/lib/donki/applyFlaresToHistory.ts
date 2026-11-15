import type { DonkiFlareRecord, VitalReadings } from "@/types/health";
import { flareClassToDailyDoseBumpMsv, flareClassToHourlyDoseBumpMsv } from "./flareClass";

function utcCalendarDay(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function utcHour(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours();
}

function sortedDaily(history: VitalReadings[]): VitalReadings[] {
  return [...history].sort((a, b) => a.missionDay - b.missionDay);
}

/**
 * Maps DONKI flare peaks to mission days — exact UTC date match first, then recent flares
 * pin to the latest mission days so live space-weather still drives the radiation chart.
 */
function mapFlaresToMissionDays(
  history: VitalReadings[],
  flares: DonkiFlareRecord[]
): Map<number, DonkiFlareRecord[]> {
  const byDay = new Map<number, DonkiFlareRecord[]>();
  const daily = sortedDaily(history);
  if (daily.length === 0) return byDay;

  const unmatched: DonkiFlareRecord[] = [];

  for (const flare of flares) {
    const peakDay = utcCalendarDay(flare.peakTime);
    if (!peakDay) continue;
    const exact = daily.find((h) => utcCalendarDay(h.recordedAt) === peakDay);
    if (exact) {
      const list = byDay.get(exact.missionDay) ?? [];
      list.push(flare);
      byDay.set(exact.missionDay, list);
    } else {
      unmatched.push(flare);
    }
  }

  if (unmatched.length === 0) return byDay;

  const sortedFlares = [...unmatched].sort(
    (a, b) => Date.parse(b.peakTime) - Date.parse(a.peakTime)
  );
  const tailDays = daily.slice(-Math.min(daily.length, sortedFlares.length));

  sortedFlares.forEach((flare, index) => {
    const target = tailDays[index];
    if (!target) return;
    const list = byDay.get(target.missionDay) ?? [];
    list.push(flare);
    byDay.set(target.missionDay, list);
  });

  return byDay;
}

/** Adds illustrative dose bumps on mission days aligned with DONKI flare peaks. */
export function applyDonkiFlaresToDailyHistory(
  history: VitalReadings[],
  flares: DonkiFlareRecord[] | undefined
): VitalReadings[] {
  if (!flares?.length) return history;

  const byMissionDay = mapFlaresToMissionDays(history, flares);

  return history.map((reading) => {
    const dayFlares = byMissionDay.get(reading.missionDay);
    if (!dayFlares?.length) return reading;

    const bump = dayFlares.reduce(
      (acc, f) => acc + flareClassToDailyDoseBumpMsv(f.classType),
      0
    );
    const topClass = dayFlares
      .map((f) => f.classType)
      .sort((a, b) => flareClassToDailyDoseBumpMsv(b) - flareClassToDailyDoseBumpMsv(a))[0];

    return {
      ...reading,
      radiationMsv: (reading.radiationMsv ?? 0) + bump,
      extraMetrics: {
        ...reading.extraMetrics,
        donkiFlareClass: topClass,
        donkiFlareCount: String(dayFlares.length),
        donkiFlareMapped: "mission_align",
      },
    };
  });
}

function flaresForMissionDay(
  flares: DonkiFlareRecord[] | undefined,
  missionDay: number,
  history: VitalReadings[]
): DonkiFlareRecord[] {
  if (!flares?.length) return [];
  const byDay = mapFlaresToMissionDays(history, flares);
  return byDay.get(missionDay) ?? [];
}

export function applyDonkiFlareToHourlyReading(
  reading: VitalReadings,
  flares: DonkiFlareRecord[] | undefined,
  missionDailySource: VitalReadings[]
): VitalReadings {
  if (!flares?.length) return reading;

  const dayFlares = flaresForMissionDay(flares, reading.missionDay, missionDailySource);
  if (dayFlares.length === 0) return reading;

  const hour =
    reading.extraMetrics?.intradaySlot !== undefined
      ? Number(reading.extraMetrics.intradaySlot)
      : utcHour(reading.recordedAt);
  if (hour === null || Number.isNaN(hour)) {
    return reading;
  }

  let bump = 0;
  let topClass: string | undefined;
  for (const flare of dayFlares) {
    const flareHour = utcHour(flare.peakTime);
    const h = flareHour ?? 14;
    if (Math.abs(h - hour) <= 2) {
      const hBump = flareClassToHourlyDoseBumpMsv(flare.classType);
      if (hBump > bump) {
        bump = hBump;
        topClass = flare.classType;
      }
    }
  }

  if (bump <= 0) {
    const fallback = dayFlares[0];
    if (hour >= 12 && hour <= 18 && fallback) {
      bump = flareClassToHourlyDoseBumpMsv(fallback.classType);
      topClass = fallback.classType;
    }
  }

  if (bump <= 0) return reading;
  return {
    ...reading,
    radiationMsv: (reading.radiationMsv ?? 0) + bump,
    extraMetrics: {
      ...reading.extraMetrics,
      ...(topClass ? { donkiFlareClass: topClass } : {}),
    },
  };
}