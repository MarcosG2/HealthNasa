import { NextResponse } from "next/server";
import type { MentalHealthSurveySubmission } from "@/types/health";

/** In-memory stub for ground-sync demos — resets on deploy. */
const memorySubmissions: MentalHealthSurveySubmission[] = [];

export async function GET() {
  return NextResponse.json({
    ok: true,
    count: memorySubmissions.length,
    submissions: memorySubmissions,
    note: "Client stores responses in localStorage; this endpoint is optional ground sync.",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MentalHealthSurveySubmission;
    if (!body.id || !body.submittedAt || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { ok: false, error: "Invalid mental health payload" },
        { status: 400 }
      );
    }
    memorySubmissions.push(body);
    await new Promise((resolve) => setTimeout(resolve, 400));

    return NextResponse.json({
      ok: true,
      received: body.id,
      message:
        "Behavioral health check-in queued for flight surgeon review (simulated).",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
}