"use client";

import type { AppLocale } from "@/lib/locale";
import { MentalHealthSurveyForm } from "@/features/vitals-form/MentalHealthSurveyForm";
import { MemoryEmojiGame } from "@/features/vitals-form/MemoryEmojiGame";

interface CognitiveWellnessPanelProps {
  locale?: AppLocale;
  astronautId?: string;
  missionDay?: number;
}

export function CognitiveWellnessPanel({
  locale = "en",
  astronautId,
  missionDay,
}: CognitiveWellnessPanelProps) {
  const sessionSeed =
    astronautId && missionDay !== undefined
      ? `${astronautId}-md${missionDay}`
      : undefined;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
      <MentalHealthSurveyForm
        locale={locale}
        astronautId={astronautId}
        missionDay={missionDay}
        sessionSeed={sessionSeed}
      />
      <MemoryEmojiGame locale={locale} />
    </div>
  );
}