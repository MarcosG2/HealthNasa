"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Flame } from "lucide-react";
import { MEASUREMENT_GUIDE } from "@/data/nasaKnowledge";
import { statusStyles } from "@/lib/statusColors";
import type { MissionEnvironment, VitalReadings } from "@/types/health";

const STORAGE_KEY = "healthnasa_checkin_streak";
const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Great"] as const;

const STEP_FIELDS: {
  key: keyof VitalReadings;
  label: string;
  type: "number" | "mood" | "optional";
  step?: number;
}[] = [
  { key: "systolicBP", label: "Systolic BP", type: "number" },
  { key: "diastolicBP", label: "Diastolic BP", type: "number" },
  { key: "heartRate", label: "Heart rate", type: "number" },
  { key: "bloodSugar", label: "Blood sugar", type: "number" },
  { key: "temperature", label: "Temperature", type: "number", step: 0.1 },
  { key: "sleepHours", label: "Sleep hours", type: "number", step: 0.1 },
  { key: "moodScore", label: "Mood", type: "mood" },
];

interface VitalsInputFormProps {
  environment: MissionEnvironment;
  missionDay: number;
  onSubmit: (reading: VitalReadings) => void;
}

export function VitalsInputForm({
  environment,
  missionDay,
  onSubmit,
}: VitalsInputFormProps) {
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

  const currentField = STEP_FIELDS[step];
  const guide = useMemo(() => {
    if (!currentField || currentField.type === "mood") return null;
    const metric = currentField.key as keyof typeof MEASUREMENT_GUIDE;
    return MEASUREMENT_GUIDE[metric];
  }, [currentField]);

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

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Daily check-in</h3>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${streakStyles.bg} ${streakStyles.text}`}
        >
          <Flame className="h-4 w-4" aria-hidden />
          {streak} day streak — keep your routine
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        Step {step + 1} of {STEP_FIELDS.length}: {currentField?.label}
      </p>

      {guide && (
        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-300">
          <p className="font-medium text-slate-100">How to measure</p>
          <p className="mt-1">{guide.howTo}</p>
          <p className="mt-2 font-medium text-slate-100">Why in space</p>
          <p className="mt-1">{guide.whySpace}</p>
        </div>
      )}

      {currentField?.type === "mood" ? (
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
              {n} — {MOOD_LABELS[n - 1]}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="number"
          step={currentField?.step ?? 1}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          value={(form[currentField.key as keyof VitalReadings] as number) ?? ""}
          onChange={(e) => updateField(currentField.key, Number(e.target.value))}
        />
      )}

      <div className="mt-4 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <Camera className="h-4 w-4" />
          Optional image (camera / ultrasound note)
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Upload preview" className="h-12 w-12 rounded object-cover" />
        )}
      </div>

      <div className="mt-6 flex justify-between gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEP_FIELDS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={submitAll}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Save today&apos;s log
          </button>
        )}
      </div>
    </div>
  );
}