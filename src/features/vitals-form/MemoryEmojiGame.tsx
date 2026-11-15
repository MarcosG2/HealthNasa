"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid3X3, RotateCcw } from "lucide-react";
import type { AppLocale } from "@/lib/locale";
import type { MemoryGameResult } from "@/types/health";
import { MEMORY_GAME_LOG_KEY } from "@/features/vitals-form/mentalHealthStorage";

const GRID_SIZE = 5;
const PAIR_COUNT = 12;

const SPACE_EMOJIS = [
  "🚀",
  "🛰️",
  "🌙",
  "⭐",
  "🪐",
  "☄️",
  "🧑‍🚀",
  "🛸",
  "🌍",
  "🔭",
  "🌌",
  "⚡",
] as const;

const COPY: Record<
  AppLocale,
  {
    title: string;
    hint: string;
    moves: string;
    time: string;
    pairs: string;
    memoryScore: string;
    feedbackTitle: string;
    feedbackGood: string;
    feedbackMid: string;
    feedbackLow: string;
    reset: string;
    complete: string;
    lastRun: string;
    why: string;
  }
> = {
  en: {
    title: "Mission memory grid (5×5)",
    hint: "Flip two cards to find matching space icons. Twelve pairs plus one neutral comm tile.",
    moves: "Moves",
    time: "Time",
    pairs: "Pairs",
    memoryScore: "Memory index",
    feedbackTitle: "Crew neuro feedback",
    feedbackGood:
      "Strong recall — within expected range for rested crew on long-duration flight.",
    feedbackMid:
      "Adequate recall — consider a short break; micro-gravity and sleep debt affect working memory.",
    feedbackLow:
      "Below baseline — repeat after hydration and rest; flag if pattern persists (NASA HRP behavioral health).",
    reset: "New board",
    complete: "Board cleared",
    lastRun: "Last session",
    why: "Spatial memory helps track instrument panels when comm lag delays ground prompts.",
  },
  es: {
    title: "Cuadrícula de memoria (5×5)",
    hint: "Voltea dos tarjetas para emparejar iconos espaciales. Doce pares y una casilla neutra.",
    moves: "Movimientos",
    time: "Tiempo",
    pairs: "Pares",
    memoryScore: "Índice de memoria",
    feedbackTitle: "Feedback neuro de tripulación",
    feedbackGood:
      "Buen recuerdo — dentro del rango esperado para tripulación descansada en vuelo prolongado.",
    feedbackMid:
      "Recuerdo aceptable — considera una pausa; la microgravedad y el sueño afectan la memoria de trabajo.",
    feedbackLow:
      "Por debajo del baseline — repite tras hidratarte y descansar; reporta si persiste (salud conductual NASA HRP).",
    reset: "Nueva cuadrícula",
    complete: "Cuadrícula completa",
    lastRun: "Última sesión",
    why: "La memoria espacial ayuda a seguir paneles cuando el retardo de comunicación retrasa ayuda de Tierra.",
  },
};

interface CardCell {
  uid: string;
  emoji: string;
  pairId: string;
  isHub: boolean;
  matched: boolean;
  faceUp: boolean;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(): CardCell[] {
  const pairs = SPACE_EMOJIS.slice(0, PAIR_COUNT);
  const tiles: CardCell[] = [];
  for (const emoji of pairs) {
    const pairId = emoji;
    tiles.push({
      uid: `${pairId}-a`,
      emoji,
      pairId,
      isHub: false,
      matched: false,
      faceUp: false,
    });
    tiles.push({
      uid: `${pairId}-b`,
      emoji,
      pairId,
      isHub: false,
      matched: false,
      faceUp: false,
    });
  }
  tiles.push({
    uid: "hub-comm",
    emoji: "📡",
    pairId: "hub",
    isHub: true,
    matched: true,
    faceUp: true,
  });
  return shuffle(tiles);
}

function loadLastResult(): MemoryGameResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMORY_GAME_LOG_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as MemoryGameResult[];
    if (!Array.isArray(list) || list.length === 0) return null;
    return list[list.length - 1] ?? null;
  } catch {
    return null;
  }
}

function persistResult(result: MemoryGameResult): void {
  try {
    const raw = localStorage.getItem(MEMORY_GAME_LOG_KEY);
    const list = raw ? (JSON.parse(raw) as MemoryGameResult[]) : [];
    const next = Array.isArray(list) ? [...list, result] : [result];
    localStorage.setItem(MEMORY_GAME_LOG_KEY, JSON.stringify(next.slice(-20)));
  } catch {
    /* ignore */
  }
}

function computeMemoryScore(moves: number, elapsedSec: number, pairs: number): number {
  const movePenalty = Math.max(0, moves - pairs * 2) * 2;
  const timePenalty = Math.max(0, elapsedSec - 90);
  const raw = 100 - movePenalty - Math.floor(timePenalty / 2);
  return Math.max(0, Math.min(100, raw));
}

function feedbackForScore(locale: AppLocale, score: number): string {
  const ui = COPY[locale];
  if (score >= 75) return ui.feedbackGood;
  if (score >= 45) return ui.feedbackMid;
  return ui.feedbackLow;
}

interface MemoryEmojiGameProps {
  locale?: AppLocale;
}

export function MemoryEmojiGame({ locale = "en" }: MemoryEmojiGameProps) {
  const ui = COPY[locale];
  const [deck, setDeck] = useState<CardCell[] | null>(null);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [finished, setFinished] = useState(false);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<MemoryGameResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    setLastResult(loadLastResult());
    setDeck(buildDeck());
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const resetBoard = useCallback(() => {
    stopTimer();
    startedRef.current = false;
    setDeck(buildDeck());
    setMoves(0);
    setPairsFound(0);
    setElapsedSec(0);
    setActiveIndex(null);
    setLockBoard(false);
    setFinished(false);
    setLiveScore(null);
  }, [stopTimer]);

  function finishGame(finalMoves: number, finalElapsed: number, pairs: number) {
    stopTimer();
    setFinished(true);
    const memoryScore = computeMemoryScore(finalMoves, finalElapsed, pairs);
    setLiveScore(memoryScore);
    const result: MemoryGameResult = {
      submittedAt: new Date().toISOString(),
      gridSize: GRID_SIZE,
      totalPairs: PAIR_COUNT,
      pairsFound: pairs,
      moves: finalMoves,
      elapsedSec: finalElapsed,
      memoryScore,
    };
    persistResult(result);
    setLastResult(result);
  }

  function onCardClick(index: number) {
    if (!deck) return;
    const card = deck[index];
    if (!card || card.isHub || card.matched || card.faceUp || lockBoard) return;

    if (!startedRef.current) {
      startedRef.current = true;
      startTimer();
    }

    const nextDeck = deck.map((c, i) =>
      i === index ? { ...c, faceUp: true } : c
    );

    if (activeIndex === null) {
      setDeck(nextDeck);
      setActiveIndex(index);
      return;
    }

    if (activeIndex === index) return;

    const first = nextDeck[activeIndex];
    const second = nextDeck[index];
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setDeck(nextDeck);
    setActiveIndex(null);
    setLockBoard(true);

    const isMatch = first.pairId === second.pairId;
    if (isMatch) {
      const matchedDeck = nextDeck.map((c) =>
        c.pairId === first.pairId ? { ...c, matched: true, faceUp: true } : c
      );
      const nextPairs = pairsFound + 1;
      setDeck(matchedDeck);
      setPairsFound(nextPairs);
      setLockBoard(false);
      if (nextPairs >= PAIR_COUNT) {
        finishGame(nextMoves, elapsedSec, nextPairs);
      }
    } else {
      setTimeout(() => {
        setDeck((current) => {
          if (!current) return current;
          return current.map((c) =>
            c.uid === first.uid || c.uid === second.uid
              ? { ...c, faceUp: false }
              : c
          );
        });
        setLockBoard(false);
      }, 700);
    }
  }

  const displayScore = useMemo(() => {
    if (liveScore !== null) return liveScore;
    if (moves === 0) return null;
    return computeMemoryScore(moves, elapsedSec, pairsFound);
  }, [liveScore, moves, elapsedSec, pairsFound]);

  if (!deck) {
    return (
      <div className="mission-panel p-4 text-sm text-base-content/70">
        {ui.hint}
      </div>
    );
  }

  return (
    <div className="mission-panel p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-base-content">
        <Grid3X3 className="h-4 w-4 text-sky-400" aria-hidden />
        {ui.title}
      </h3>
      <p className="mt-2 text-sm text-base-content/75">{ui.hint}</p>

      <div className="mt-4 flex flex-col gap-4">
        <div
          className="mx-auto grid w-full max-w-[280px] shrink-0 gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
          role="grid"
          aria-label={ui.title}
        >
          {deck.map((card, index) => {
            const showFace = card.faceUp || card.matched;
            return (
              <button
                key={card.uid}
                type="button"
                role="gridcell"
                disabled={card.isHub || card.matched || lockBoard}
                onClick={() => onCardClick(index)}
                className={`flex aspect-square items-center justify-center rounded-md border text-lg transition-colors ${
                  card.isHub
                    ? "border-base-300/40 bg-base-300/25 text-base-content/40"
                    : showFace
                      ? "border-sky-400/50 bg-sky-500/15"
                      : "border-slate-700 bg-slate-900 hover:border-sky-500/40"
                }`}
                aria-label={showFace ? card.emoji : "Hidden card"}
              >
                {showFace ? card.emoji : "·"}
              </button>
            );
          })}
        </div>

        <aside className="w-full min-w-0 rounded-field border border-base-300/50 bg-base-200/25 p-3 text-sm">
          <p className="font-semibold leading-snug text-base-content">
            {ui.feedbackTitle}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-field border border-base-300/40 bg-base-100/30 px-2 py-1.5">
              <dt className="text-base-content/65">{ui.moves}</dt>
              <dd className="mission-readout tabular-nums text-primary">{moves}</dd>
            </div>
            <div className="rounded-field border border-base-300/40 bg-base-100/30 px-2 py-1.5">
              <dt className="text-base-content/65">{ui.time}</dt>
              <dd className="mission-readout tabular-nums text-primary">
                {elapsedSec}s
              </dd>
            </div>
            <div className="rounded-field border border-base-300/40 bg-base-100/30 px-2 py-1.5">
              <dt className="text-base-content/65">{ui.pairs}</dt>
              <dd className="mission-readout tabular-nums text-primary">
                {pairsFound}/{PAIR_COUNT}
              </dd>
            </div>
            <div className="rounded-field border border-base-300/40 bg-base-100/30 px-2 py-1.5">
              <dt className="text-base-content/65">{ui.memoryScore}</dt>
              <dd className="mission-readout tabular-nums font-semibold text-emerald-400">
                {displayScore ?? "—"}
                {displayScore !== null ? "/100" : ""}
              </dd>
            </div>
          </dl>
          {displayScore !== null ? (
            <p className="mt-3 text-sm leading-relaxed text-base-content/85">
              {feedbackForScore(locale, displayScore)}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-base-content/70">
              {ui.why}
            </p>
          )}
          {finished ? (
            <p className="mt-2 text-xs font-medium text-emerald-400" role="status">
              {ui.complete}
            </p>
          ) : null}
          {lastResult ? (
            <p className="mt-2 text-[11px] text-base-content/60">
              {ui.lastRun}: {lastResult.memoryScore}/100 · {lastResult.moves}{" "}
              {ui.moves.toLowerCase()} · {lastResult.elapsedSec}s
            </p>
          ) : null}
          <button
            type="button"
            onClick={resetBoard}
            className="btn btn-outline btn-xs mt-3 gap-1"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            {ui.reset}
          </button>
        </aside>
      </div>
    </div>
  );
}