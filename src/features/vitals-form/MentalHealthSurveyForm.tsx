"use client";

import { useMemo, useState } from "react";
import { Brain, ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { AppLocale } from "@/lib/locale";
import type { MentalHealthLikert, MentalHealthSurveySubmission } from "@/types/health";
import {
  compositeWellnessScore,
  mentalHealthQuestionText,
  pickSessionQuestions,
} from "@/features/vitals-form/data/mentalHealthQuestions";
import {
  loadMentalHealthSubmissions,
  saveMentalHealthSubmissions,
  syncMentalHealthSubmission,
} from "@/features/vitals-form/mentalHealthStorage";

const COPY: Record<
  AppLocale,
  {
    title: string;
    intro: string;
    likertLow: string;
    likertHigh: string;
    submit: string;
    submitting: string;
    required: string;
    saved: string;
    syncOk: string;
    syncFail: string;
    lastScore: string;
    history: string;
    slidePrev: string;
    slideNext: string;
    slideOf: string;
    slideRequired: string;
  }
> = {
  en: {
    title: "Mental wellness check-in",
    intro:
      "Eight short items from a larger NASA HRP–inspired pool. Answers stay on-device and can be queued for ground sync.",
    likertLow: "Strongly disagree",
    likertHigh: "Strongly agree",
    submit: "Send responses",
    submitting: "Sending…",
    required: "Answer each item before sending.",
    saved: "Responses stored locally.",
    syncOk: "Ground sync acknowledged (simulated).",
    syncFail: "Could not reach ground; local copy kept.",
    lastScore: "Wellness index",
    history: "Past check-ins",
    slidePrev: "Previous",
    slideNext: "Next",
    slideOf: "Set",
    slideRequired:
      "Answer all four items in this set before continuing or sending.",
  },
  es: {
    title: "Control de bienestar mental",
    intro:
      "Ocho ítems breves de un pool inspirado en NASA HRP. Las respuestas se guardan en el dispositivo y pueden enviarse a Tierra.",
    likertLow: "Totalmente en desacuerdo",
    likertHigh: "Totalmente de acuerdo",
    submit: "Enviar respuestas",
    submitting: "Enviando…",
    required: "Responde cada ítem antes de enviar.",
    saved: "Respuestas guardadas localmente.",
    syncOk: "Sincronización con Tierra confirmada (simulada).",
    syncFail: "Sin enlace con Tierra; copia local conservada.",
    lastScore: "Índice de bienestar",
    history: "Controles anteriores",
    slidePrev: "Anterior",
    slideNext: "Siguiente",
    slideOf: "Grupo",
    slideRequired:
      "Responde los cuatro ítems de este grupo antes de continuar o enviar.",
  },
};

const LIKERT: MentalHealthLikert[] = [1, 2, 3, 4, 5];
const QUESTIONS_PER_SLIDE = 4;

interface MentalHealthSurveyFormProps {
  locale?: AppLocale;
  astronautId?: string;
  missionDay?: number;
  sessionSeed?: string;
}

function newSubmissionId(): string {
  return `mhs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MentalHealthSurveyForm({
  locale = "en",
  astronautId,
  missionDay,
  sessionSeed,
}: MentalHealthSurveyFormProps) {
  const ui = COPY[locale];
  const questions = useMemo(
    () => pickSessionQuestions(8, sessionSeed),
    [sessionSeed]
  );
  const slides = useMemo(() => {
    const chunks: (typeof questions)[] = [];
    for (let i = 0; i < questions.length; i += QUESTIONS_PER_SLIDE) {
      chunks.push(questions.slice(i, i + QUESTIONS_PER_SLIDE));
    }
    return chunks;
  }, [questions]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | undefined>>({});
  const [slideValidationOn, setSlideValidationOn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<MentalHealthSurveySubmission[]>(() =>
    typeof window === "undefined" ? [] : loadMentalHealthSubmissions()
  );

  function setAnswer(questionId: string, value: MentalHealthLikert) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setStatus(null);
  }

  function isSlideComplete(slide: number): boolean {
    const chunk = slides[slide] ?? [];
    return chunk.every((q) => answers[q.id] !== undefined);
  }

  function canNavigateToSlide(target: number): boolean {
    if (target <= slideIndex) return true;
    for (let s = 0; s < target; s += 1) {
      if (!isSlideComplete(s)) return false;
    }
    return true;
  }

  function requireCurrentSlideComplete(): boolean {
    if (isSlideComplete(slideIndex)) return true;
    setSlideValidationOn(true);
    setStatus(ui.slideRequired);
    return false;
  }

  function goToSlide(target: number) {
    if (target === slideIndex) return;
    if (target > slideIndex && !requireCurrentSlideComplete()) return;
    if (!canNavigateToSlide(target)) {
      setSlideValidationOn(true);
      setStatus(ui.slideRequired);
      return;
    }
    setSlideIndex(target);
    setSlideValidationOn(false);
    setStatus(null);
  }

  function goNextSlide() {
    if (!requireCurrentSlideComplete()) return;
    setSlideIndex((i) => Math.min(slides.length - 1, i + 1));
    setSlideValidationOn(false);
    setStatus(null);
  }

  async function onSubmit() {
    if (!requireCurrentSlideComplete()) return;

    const complete = questions.every((q) => answers[q.id] !== undefined);
    if (!complete) {
      const firstMissing = questions.findIndex((q) => answers[q.id] === undefined);
      if (firstMissing >= 0) {
        setSlideIndex(Math.floor(firstMissing / QUESTIONS_PER_SLIDE));
      }
      setSlideValidationOn(true);
      setStatus(ui.required);
      return;
    }

    const compositeScore = compositeWellnessScore(questions, answers);
    const submission: MentalHealthSurveySubmission = {
      id: newSubmissionId(),
      submittedAt: new Date().toISOString(),
      astronautId,
      missionDay,
      sessionQuestionIds: questions.map((q) => q.id),
      answers: questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] as MentalHealthLikert,
      })),
      compositeScore,
    };

    setBusy(true);
    const nextHistory = [...history, submission];
    saveMentalHealthSubmissions(nextHistory);
    setHistory(nextHistory);

    const sync = await syncMentalHealthSubmission(submission);
    setBusy(false);
    setStatus(
      `${ui.saved} ${ui.lastScore}: ${compositeScore}/100. ${
        sync.ok ? ui.syncOk : ui.syncFail
      }`
    );
    setAnswers({});
    setSlideIndex(0);
    setSlideValidationOn(false);
  }

  const slideQuestions = slides[slideIndex] ?? [];
  const globalOffset = slideIndex * QUESTIONS_PER_SLIDE;
  const currentSlideComplete = isSlideComplete(slideIndex);

  return (
    <div className="mission-panel p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-base-content">
        <Brain className="h-4 w-4 text-violet-400" aria-hidden />
        {ui.title}
      </h3>
      <p className="mt-2 text-sm text-base-content/75">{ui.intro}</p>

      <div
        className="mt-4 flex items-center justify-between gap-2"
        aria-live="polite"
      >
        <p className="text-xs font-medium text-base-content/70">
          {ui.slideOf} {slideIndex + 1}/{slides.length}
        </p>
        <div className="flex gap-1" role="tablist" aria-label={ui.slideOf}>
          {slides.map((_, i) => {
            const reachable = canNavigateToSlide(i);
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === slideIndex}
                disabled={!reachable}
                onClick={() => goToSlide(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === slideIndex
                    ? "bg-violet-400"
                    : reachable
                      ? "bg-base-content/25 hover:bg-violet-300/60"
                      : "cursor-not-allowed bg-base-content/15 opacity-50"
                }`}
                aria-label={`${ui.slideOf} ${i + 1}`}
              />
            );
          })}
        </div>
      </div>

      <ol className="mt-3 space-y-4" key={slideIndex}>
        {slideQuestions.map((q, index) => {
          const unanswered =
            slideValidationOn && answers[q.id] === undefined;
          return (
          <li
            key={q.id}
            className={`rounded-field border bg-base-200/30 p-3 ${
              unanswered
                ? "border-amber-500/60 ring-1 ring-amber-500/30"
                : "border-base-300/50"
            }`}
          >
            <p className="text-sm font-medium text-base-content">
              <span className="mission-readout text-xs text-primary">
                {globalOffset + index + 1}/{questions.length}
              </span>{" "}
              {mentalHealthQuestionText(q, locale)}
            </p>
            <div
              className="mt-3 flex flex-wrap items-center gap-2"
              role="radiogroup"
              aria-label={mentalHealthQuestionText(q, locale)}
            >
              {LIKERT.map((value) => {
                const selected = answers[q.id] === value;
                return (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-field border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? "border-violet-400 bg-violet-500/20 text-violet-100"
                        : "border-base-300/60 bg-base-100/40 text-base-content/80 hover:border-violet-400/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={value}
                      checked={selected}
                      onChange={() => setAnswer(q.id, value)}
                      className="sr-only"
                    />
                    {value}
                  </label>
                );
              })}
            </div>
            <p className="mt-1 flex justify-between text-[10px] text-base-content/55">
              <span>{ui.likertLow}</span>
              <span>{ui.likertHigh}</span>
            </p>
          </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-outline btn-sm gap-1"
          disabled={slideIndex === 0}
          onClick={() => goToSlide(slideIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {ui.slidePrev}
        </button>
        {slideIndex < slides.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary btn-sm gap-1"
            disabled={!currentSlideComplete}
            onClick={goNextSlide}
          >
            {ui.slideNext}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={busy || !currentSlideComplete}
            className="btn btn-sm btn-primary gap-2"
          >
            <Send className="h-4 w-4" aria-hidden />
            {busy ? ui.submitting : ui.submit}
          </button>
        )}
      </div>

      {status ? (
        <p className="mt-3 text-sm text-base-content/85" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {history.length > 0 ? (
        <details className="mt-4 text-sm text-base-content/80">
          <summary className="cursor-pointer font-medium text-base-content">
            {ui.history} ({history.length})
          </summary>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
            {[...history].reverse().slice(0, 6).map((entry) => (
              <li key={entry.id} className="mission-readout text-primary/90">
                {new Date(entry.submittedAt).toLocaleString(locale)} —{" "}
                {ui.lastScore} {entry.compositeScore}/100
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}