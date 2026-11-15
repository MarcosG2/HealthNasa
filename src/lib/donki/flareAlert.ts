import type { DonkiFlareAlertSeverity, DonkiFlareRecord } from "@/types/health";
import { parseFlareClass } from "./flareClass";

const RECENT_ALERT_MS = 72 * 60 * 60 * 1000;

function flareScore(record: DonkiFlareRecord): number {
  const { letter, magnitude } = parseFlareClass(record.classType);
  if (letter === "X") return 100 + magnitude * 10;
  if (letter === "M") return 40 + magnitude * 4;
  if (letter === "C") return magnitude;
  return 0;
}

function severityForFlare(record: DonkiFlareRecord): DonkiFlareAlertSeverity {
  const { letter, magnitude } = parseFlareClass(record.classType);
  const hasSepLink = record.linkedEvents?.some((e) => e.activityID.includes("SEP")) ?? false;
  const hasCmeLink = record.linkedEvents?.some((e) => e.activityID.includes("CME")) ?? false;

  if (letter === "X" || (letter === "M" && magnitude >= 5)) return "critical";
  if (letter === "M" || hasSepLink) return "warning";
  if (letter === "C" && (magnitude >= 8 || hasCmeLink)) return "watch";
  return "none";
}

function maxSeverity(
  a: DonkiFlareAlertSeverity,
  b: DonkiFlareAlertSeverity
): DonkiFlareAlertSeverity {
  const order: DonkiFlareAlertSeverity[] = ["none", "watch", "warning", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? "none";
}

export function pickPeakFlare(flares: DonkiFlareRecord[]): DonkiFlareRecord | null {
  if (flares.length === 0) return null;
  return [...flares].sort((a, b) => flareScore(b) - flareScore(a))[0] ?? null;
}

export function buildFlareAlert(
  flares: DonkiFlareRecord[],
  nowMs = Date.now()
): {
  active: boolean;
  severity: DonkiFlareAlertSeverity;
  headline: string;
  peakFlare: DonkiFlareRecord | null;
} {
  const recent = flares.filter((f) => {
    const t = Date.parse(f.peakTime);
    return Number.isFinite(t) && nowMs - t <= RECENT_ALERT_MS;
  });

  if (recent.length === 0) {
    return {
      active: false,
      severity: "none",
      headline: "",
      peakFlare: null,
    };
  }

  const peakFlare = pickPeakFlare(recent);
  let severity: DonkiFlareAlertSeverity = "none";
  for (const flare of recent) {
    severity = maxSeverity(severity, severityForFlare(flare));
  }

  if (severity === "none" && peakFlare) {
    severity = "watch";
  }

  const active = severity !== "none" && peakFlare !== null;
  const headline = peakFlare
    ? `Solar flare ${peakFlare.classType} · peak ${peakFlare.peakTime.replace("Z", " UTC")}`
    : "";

  return { active, severity, headline, peakFlare };
}