import { NextResponse } from "next/server";
import type { VitalReadings } from "@/types/health";

/** In-memory stub for ground-sync demos — resets on deploy (Render ephemeral FS). */
const memoryLogs: VitalReadings[] = [];

export async function GET() {
  return NextResponse.json({
    ok: true,
    count: memoryLogs.length,
    logs: memoryLogs,
    note: "Client-side evaluation works fully offline; this endpoint is optional.",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VitalReadings;
    if (typeof body.missionDay !== "number" || !body.recordedAt) {
      return NextResponse.json(
        { ok: false, error: "Invalid vitals payload" },
        { status: 400 }
      );
    }
    memoryLogs.push(body);
    return NextResponse.json({ ok: true, received: body.missionDay });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
}