import { NextResponse } from "next/server";
import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import type { MissionEnvironment } from "@/types/health";

function parseEnvironment(value: string | null): MissionEnvironment {
  if (
    value === "station" ||
    value === "spacecraft" ||
    value === "rover" ||
    value === "lunar_base"
  ) {
    return value;
  }
  return "lunar_base";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const environment = parseEnvironment(searchParams.get("environment"));
  const days = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("days") ?? "14", 10) || 14)
  );

  const logs = buildMockMissionHistory(environment).slice(0, days);

  return NextResponse.json({
    ok: true,
    environment,
    days,
    telemetry: logs,
    note: "Optional demo feed — does not replace offline evaluateHealth().",
  });
}