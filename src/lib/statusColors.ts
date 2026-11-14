import type { HealthStatus } from "@/types/health";

const STATUS_STYLES: Record<
  HealthStatus,
  { text: string; bg: string; ring: string; dot: string }
> = {
  normal: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/40",
    dot: "bg-emerald-500",
  },
  warning: {
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/40",
    dot: "bg-amber-500",
  },
  critical: {
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    ring: "ring-rose-500/40",
    dot: "bg-rose-500",
  },
};

export function statusStyles(status: HealthStatus) {
  return STATUS_STYLES[status];
}

export function statusLabel(status: HealthStatus): string {
  const labels: Record<HealthStatus, string> = {
    normal: "Normal",
    warning: "Needs attention",
    critical: "Critical",
  };
  return labels[status];
}