import { MUSCLE_GROUPS, type MuscleGroup } from "@emmorts/body-muscles";
import type { BodyState, MuscleId } from "@emmorts/body-muscles";
import type { BodySystemStatus, HealthStatus, SystemStatusEntry } from "@/types/health";

const SYSTEM_GROUPS: Record<BodySystemStatus, MuscleGroup[]> = {
  neuro_behavioral: ["Head & Neck"],
  cardiovascular: ["Chest"],
  metabolic: ["Abdominals"],
  immune_musculoskeletal: ["Arms", "Legs", "Back", "Shoulders"],
};

const MUSCLE_TO_SYSTEM = new Map<MuscleId, BodySystemStatus>();

for (const [system, groups] of Object.entries(SYSTEM_GROUPS) as [
  BodySystemStatus,
  MuscleGroup[],
][]) {
  for (const group of groups) {
    for (const muscleId of MUSCLE_GROUPS[group]) {
      MUSCLE_TO_SYSTEM.set(muscleId, system);
    }
  }
}

export function muscleIdToBodySystem(id: MuscleId): BodySystemStatus | null {
  return MUSCLE_TO_SYSTEM.get(id) ?? null;
}

function statusToIntensity(status: HealthStatus): number {
  if (status === "critical") return 9;
  if (status === "warning") return 6;
  return 2;
}

export function buildBodyMuscleState(
  systemStatuses: SystemStatusEntry[],
  selectedSystem: BodySystemStatus
): BodyState {
  const statusBySystem = new Map<BodySystemStatus, HealthStatus>();
  for (const entry of systemStatuses) {
    statusBySystem.set(entry.system, entry.status);
  }

  const state: BodyState = {};
  for (const system of Object.keys(SYSTEM_GROUPS) as BodySystemStatus[]) {
    const intensity = statusToIntensity(statusBySystem.get(system) ?? "normal");
    const selected = system === selectedSystem;
    for (const group of SYSTEM_GROUPS[system]) {
      for (const muscleId of MUSCLE_GROUPS[group]) {
        state[muscleId] = { intensity, selected };
      }
    }
  }
  return state;
}