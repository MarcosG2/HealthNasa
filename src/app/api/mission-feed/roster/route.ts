import { NextResponse } from "next/server";
import { ASTRONAUT_ROSTER, archetypeLabel } from "@/data/astronautRoster";

export async function GET() {
  const roster = ASTRONAUT_ROSTER.map((entry) => ({
    ...entry,
    statusLabelEs: archetypeLabel(entry.archetype, "es"),
    statusLabelEn: archetypeLabel(entry.archetype, "en"),
  }));

  return NextResponse.json({
    ok: true,
    count: roster.length,
    roster,
    note: "Fictional multi-crew roster for demo ground API.",
  });
}