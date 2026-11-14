import { NextResponse } from "next/server";
import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import type { MissionEnvironment, VitalReadings } from "@/types/health";

/** In-memory stub for ground-sync demos — resets on deploy (Render ephemeral FS). */
const memoryLogs: VitalReadings[] = [];

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

function simulateLatencyMs(environment: MissionEnvironment): number {
  const map: Record<MissionEnvironment, number> = {
    station: 500,
    spacecraft: 12 * 60 * 1000,
    rover: 2600,
    lunar_base: 2600,
    mars_base: 18 * 60 * 1000,
  };
  return map[environment];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const environment = parseEnvironment(searchParams.get("environment"));
  const days = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("days") ?? "14", 10) || 14)
  );

  if (searchParams.get("environment") || searchParams.get("days")) {
    const synthetic = buildMockMissionHistory(environment).slice(0, days);
    return NextResponse.json({
      ok: true,
      mode: "synthetic_telemetry",
      environment,
      days,
      logs: synthetic,
      signalLatencyMs: simulateLatencyMs(environment),
      note: "Synthetic telemetry for demos; client evaluation remains offline-first.",
    });
  }

  return NextResponse.json({
    ok: true,
    count: memoryLogs.length,
    logs: memoryLogs,
    note: "Client-side evaluation works fully offline; this endpoint is optional.",
  });
}

interface PostPayload extends VitalReadings {
  syncAck?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostPayload;
    if (typeof body.missionDay !== "number" || !body.recordedAt) {
      return NextResponse.json(
        { ok: false, error: "Invalid vitals payload" },
        { status: 400 }
      );
    }

    const { syncAck, ...vitals } = body;
    memoryLogs.push(vitals);

    const latencyMs = simulateLatencyMs(vitals.environment ?? "station");
    await new Promise((resolve) => setTimeout(resolve, Math.min(latencyMs, 1500)));

    return NextResponse.json({
      ok: true,
      received: vitals.missionDay,
      groundSyncAck: syncAck === true,
      simulatedSignalLatencyMs: latencyMs,
      message:
        "Ground control acknowledged receipt (simulated). Clinical rules already ran on-device.",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
}