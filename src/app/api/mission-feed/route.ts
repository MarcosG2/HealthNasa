import { NextResponse } from "next/server";
import { buildFakerMissionFeed } from "@/lib/fakerMissionTelemetry";
import type { MissionEnvironment } from "@/types/health";

function parseEnvironment(value: string | null): MissionEnvironment {
  if (
    value === "station" ||
    value === "spacecraft" ||
    value === "rover" ||
    value === "lunar_base" ||
    value === "mars_base"
  ) {
    return value;
  }
  return "station";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const environment = parseEnvironment(searchParams.get("environment"));
  const days = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("days") ?? "14", 10) || 14)
  );
  const seed = searchParams.get("seed") ?? undefined;
  const astronautId = searchParams.get("astronautId") ?? undefined;

  const feed = buildFakerMissionFeed(environment, days, seed, astronautId);

  return NextResponse.json({
    ok: true,
    source: "faker_mock_ground_api",
    ...feed,
    note: "Fictional ground API for demo sync; evaluateHealth() still runs fully on-device.",
  });
}