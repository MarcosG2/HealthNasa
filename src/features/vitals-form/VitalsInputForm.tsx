"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Flame } from "lucide-react";
import {
  MEASUREMENT_GUIDE_LOCALE,
  type AppLocale,
  UI_STRINGS,
} from "@/lib/locale";
import { statusStyles } from "@/lib/statusColors";
import type { MissionEnvironment, VitalReadings } from "@/types/health";
import type { ExamThreshold } from "@/types/health";

const STORAGE_KEY = "healthnasa_checkin_streak";

const STEP_METRICS: ExamThreshold["metric"][] = [
  "systolicBP",
  "diastolicBP",
  "heartRate",
  "bloodSugar",
  "temperature",
  "sleepHours",
  "moodScore",
];

interface VitalsInputFormProps {
  environment: MissionEnvironment;
  missionDay: number;
  locale?: AppLocale;
  onSubmit: (reading: VitalReadings) => void;
}

export function VitalsInputForm({
  environment,
  missionDay,
  locale = "es",
  onSubmit,
}: VitalsInputFormProps) {
  const ui = UI_STRINGS[locale];

  const [step, setStep] = useState(0);
  const [streak, setStreak] = useState(0);
  const [preview, setPreview] = useState<string | undefined>();
  const [form, setForm] = useState<Partial<VitalReadings>>({
    environment,
    missionDay,
    moodScore: 4,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStreak(parseInt(raw, 10) || 0);
    } catch {
      /* offline / private mode */
    }
  }, []);

  const currentMetric = STEP_METRICS[step];
  const isMoodStep = currentMetric === "moodScore";
  const currentLabel = currentMetric
    ? ui.vitals[currentMetric as keyof typeof ui.vitals]
    : "";

  const guide = useMemo(() => {
    if (!currentMetric || isMoodStep) return null;
    return MEASUREMENT_GUIDE_LOCALE[locale][currentMetric];
  }, [currentMetric, isMoodStep, locale]);

  const updateField = useCallback((key: string, value: number) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  function onImageChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : undefined;
      setPreview(url);
      setForm((f) => ({ ...f, imageNoteOrDataUrl: url }));
    };
    reader.readAsDataURL(file);
  }

  function bumpStreak() {
    const next = streak + 1;
    setStreak(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }

  function submitAll() {
    const reading: VitalReadings = {
      missionDay,
      recordedAt: new Date().toISOString(),
      environment,
      systolicBP: Number(form.systolicBP ?? 120),
      diastolicBP: Number(form.diastolicBP ?? 80),
      heartRate: Number(form.heartRate ?? 72),
      bloodSugar: Number(form.bloodSugar ?? 100),
      temperature: Number(form.temperature ?? 36.7),
      sleepHours: Number(form.sleepHours ?? 7),
      moodScore: Number(form.moodScore ?? 4),
      radiationMsv: form.radiationMsv,
      imageNoteOrDataUrl: form.imageNoteOrDataUrl,
      extraMetrics: form.extraMetrics,
    };
    bumpStreak();
    onSubmit(reading);
  }

  const moodValue = form.moodScore ?? 4;
  const streakStyles = statusStyles(streak >= 7 ? "normal" : "warning");
  const streakText =
    locale === "es"
      ? `${streak} ${ui.streak}`
      : `${streak} ${ui.streak}`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">{ui.dailyCheckIn}</h3>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${streakStyles.bg} ${streakStyles.text}`}
        >
          <Flame className="h-4 w-4" aria-hidden />
          {streakText}
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        {ui.stepOf} {step + 1} {ui.of} {STEP_METRICS.length}: {currentLabel}
      </p>

      {guide && (
        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-300">
          <p className="font-medium text-slate-100">{ui.howToMeasure}</p>
          <p className="mt-1">{guide.howTo}</p>
          <p className="mt-2 font-medium text-slate-100">{ui.whyInSpace}</p>
          <p className="mt-1">{guide.whySpace}</p>
        </div>
      )}

      {isMoodStep ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateField("moodScore", n)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                moodValue === n
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {n} — {ui.mood[n - 1]}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="number"
          step={currentMetric === "temperature" || currentMetric === "sleepHours" ? 0.1 : 1}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          value={(form[currentMetric as keyof VitalReadings] as number) ?? ""}
          onChange={(e) => updateField(currentMetric, Number(e.target.value))}
        />
      )}

      <div className="mt-4 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <Camera className="h-4 w-4" />
          {ui.optionalImage}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={ui.uploadPreview}
            className="h-12 w-12 rounded object-cover"
          />
        )}
      </div>

      <div className="mt-6 flex justify-between gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
        >
          {ui.back}
        </button>
        {step < STEP_METRICS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            {ui.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={submitAll}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            {ui.saveLog}
          </button>
        )}
      </div>
    </div>
  );
}