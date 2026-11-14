"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Flame } from "lucide-react";
import {
  MEASUREMENT_GUIDE_LOCALE,
  type AppLocale,
  UI_STRINGS,
} from "@/lib/locale";
import { statusStyles } from "@/lib/statusColors";
import type { MissionEnvironment, VitalReadings, VitalsFormMetric } from "@/types/health";

const STORAGE_KEY = "healthnasa_checkin_streak";
const REACTION_KEY = "healthnasa_reaction_avg_ms";

const STEP_METRICS: VitalsFormMetric[] = [
  "systolicBP",
  "diastolicBP",
  "heartRate",
  "bloodSugar",
  "temperature",
  "sleepHours",
  "moodScore",
  "radiationMsv",
  "stressLevel",
];

interface VitalsInputFormProps {
  environment: MissionEnvironment;
  missionDay: number;
  locale?: AppLocale;
  onSubmit: (reading: VitalReadings) => void;
  pendingReactionMs?: number;
}

export function VitalsInputForm({
  environment,
  missionDay,
  locale = "es",
  onSubmit,
  pendingReactionMs,
}: VitalsInputFormProps) {
  const ui = UI_STRINGS[locale];

  const [step, setStep] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStreak(parseInt(raw, 10) || 0);
    } catch {
      /* offline / private mode */
    }
  }, []);
  const [preview, setPreview] = useState<string | undefined>();
  const [form, setForm] = useState<Partial<VitalReadings>>({
    environment,
    missionDay,
    moodScore: 4,
    stressLevel: 4,
    radiationMsv: 0.5,
  });

  const currentMetric = STEP_METRICS[step];
  const isMoodStep = currentMetric === "moodScore";
  const vitalsKey = currentMetric as keyof typeof ui.vitals;
  const currentLabel = ui.vitals[vitalsKey] ?? currentMetric;

  const guide = useMemo(() => {
    if (!currentMetric) return null;
    return MEASUREMENT_GUIDE_LOCALE[locale][currentMetric];
  }, [currentMetric, locale]);

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
    let reactionMs = pendingReactionMs;
    if (reactionMs === undefined) {
      try {
        const raw = localStorage.getItem(REACTION_KEY);
        if (raw) reactionMs = parseInt(raw, 10);
      } catch {
        /* ignore */
      }
    }

    const extraMetrics: Record<string, number | string> = {
      ...(form.extraMetrics ?? {}),
    };
    if (reactionMs !== undefined && Number.isFinite(reactionMs)) {
      extraMetrics.reactionTimeMs = reactionMs;
    }

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
      radiationMsv: form.radiationMsv !== undefined ? Number(form.radiationMsv) : undefined,
      stressLevel: form.stressLevel !== undefined ? Number(form.stressLevel) : undefined,
      imageNoteOrDataUrl: form.imageNoteOrDataUrl,
      extraMetrics: Object.keys(extraMetrics).length ? extraMetrics : undefined,
    };
    bumpStreak();
    onSubmit(reading);
  }

  const moodValue = form.moodScore ?? 4;
  const streakStyles = statusStyles(streak >= 7 ? "normal" : "warning");
  const streakText = `${streak} ${ui.streak}`;

  const stressValue = form.stressLevel ?? 4;
  const fieldId = `vital-${currentMetric}`;
  const stressOutputId = "stress-level-output";
  const progressPct = Math.round(((step + 1) / STEP_METRICS.length) * 100);

  return (
    <div className="card card-border bg-base-200/60 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{ui.dailyCheckIn}</h3>
        <div
          className={`badge gap-2 ${streakStyles.bg} ${streakStyles.text}`}
          aria-label={streakText}
        >
          <Flame className="h-4 w-4" aria-hidden />
          {streakText}
        </div>
      </div>

      <label htmlFor={fieldId} className="mb-2 block text-sm text-base-content/80">
        {ui.stepOf} {step + 1} {ui.of} {STEP_METRICS.length}: {currentLabel}
      </label>
      <progress
        className="progress progress-primary mb-4 w-full"
        value={progressPct}
        max={100}
        aria-label={`${ui.stepOf} ${step + 1} ${ui.of} ${STEP_METRICS.length}`}
      />

      {guide && (
        <div className="mb-4 rounded-box border border-base-300 bg-base-100/80 p-3 text-sm text-base-content/85">
          <p className="font-medium text-base-content">{ui.howToMeasure}</p>
          <p className="mt-1">{guide.howTo}</p>
          <p className="mt-2 font-medium text-base-content">{ui.whyInSpace}</p>
          <p className="mt-1">{guide.whySpace}</p>
        </div>
      )}

      <fieldset className="min-w-0">
        <legend className="sr-only">{currentLabel}</legend>

        {isMoodStep ? (
          <div role="radiogroup" aria-labelledby={fieldId} className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={moodValue === n}
                onClick={() => updateField("moodScore", n)}
                className={`btn btn-sm ${
                  moodValue === n ? "btn-success" : "btn-outline"
                }`}
              >
                {n} — {ui.mood[n - 1]}
              </button>
            ))}
          </div>
        ) : currentMetric === "stressLevel" ? (
          <div className="space-y-2">
            <input
              id={fieldId}
              type="range"
              min={1}
              max={10}
              step={1}
              value={stressValue}
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={stressValue}
              aria-describedby={stressOutputId}
              onChange={(e) => updateField("stressLevel", Number(e.target.value))}
              className="range range-primary w-full"
            />
            <p
              id={stressOutputId}
              className="text-center text-lg font-semibold"
              aria-live="polite"
            >
              <span className="sr-only">{ui.stressValueLabel}: </span>
              {stressValue} / 10
            </p>
          </div>
        ) : (
          <input
            id={fieldId}
            type="number"
            inputMode="decimal"
            aria-required="true"
            step={
              currentMetric === "temperature" ||
              currentMetric === "sleepHours" ||
              currentMetric === "radiationMsv"
                ? 0.1
                : 1
            }
            className="input input-bordered w-full"
            value={
              currentMetric === "radiationMsv"
                ? (form.radiationMsv ?? "")
                : ((form[currentMetric as keyof VitalReadings] as number) ?? "")
            }
            onChange={(e) => updateField(currentMetric, Number(e.target.value))}
          />
        )}
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="vital-image-upload" className="btn btn-sm btn-outline gap-2">
          <Camera className="h-4 w-4" aria-hidden />
          {ui.vitalsFileLabel}
          <input
            id="vital-image-upload"
            type="file"
            accept="image/*"
            className="sr-only"
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
          className="btn btn-outline"
        >
          {ui.back}
        </button>
        {step < STEP_METRICS.length - 1 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} className="btn btn-primary">
            {ui.next}
          </button>
        ) : (
          <button type="button" onClick={submitAll} className="btn btn-success">
            {ui.saveLog}
          </button>
        )}
      </div>
    </div>
  );
}