import type { MentalHealthQuestion } from "@/types/health";

/** Full pool (~28). Each session surfaces a subset via `pickSessionQuestions`. */
export const MENTAL_HEALTH_QUESTION_POOL: MentalHealthQuestion[] = [
  {
    id: "mh-01",
    category: "mood",
    text: "I feel hopeful about completing this mission phase.",
  },
  {
    id: "mh-02",
    category: "mood",
    text: "My mood has been stable over the last 24 hours.",
  },
  {
    id: "mh-03",
    category: "mood",
    text: "I have felt unusually down or irritable today.",
    inverted: true,
  },
  {
    id: "mh-04",
    category: "sleep",
    text: "I slept long enough to feel restored for duty.",
  },
  {
    id: "mh-05",
    category: "sleep",
    text: "I woke up refreshed rather than groggy.",
  },
  {
    id: "mh-06",
    category: "sleep",
    text: "Noise or schedule shifts disrupted my sleep last night.",
    inverted: true,
  },
  {
    id: "mh-07",
    category: "isolation",
    text: "I feel connected to crewmates even when workloads are heavy.",
  },
  {
    id: "mh-08",
    category: "isolation",
    text: "Being far from Earth feels overwhelming right now.",
    inverted: true,
  },
  {
    id: "mh-09",
    category: "isolation",
    text: "I had a meaningful conversation with at least one crew member today.",
  },
  {
    id: "mh-10",
    category: "stress",
    text: "Mission tasks feel manageable with my current energy.",
  },
  {
    id: "mh-11",
    category: "stress",
    text: "I feel tense or on edge during routine operations.",
    inverted: true,
  },
  {
    id: "mh-12",
    category: "stress",
    text: "I can calm myself within a few minutes after a stressful event.",
  },
  {
    id: "mh-13",
    category: "focus",
    text: "I can concentrate on checklists without losing my place.",
  },
  {
    id: "mh-14",
    category: "focus",
    text: "My mind wandered so much that I had to redo a task.",
    inverted: true,
  },
  {
    id: "mh-15",
    category: "focus",
    text: "I feel mentally sharp enough for time-critical procedures.",
  },
  {
    id: "mh-16",
    category: "crew",
    text: "I trust my crew to back me up if something goes wrong.",
  },
  {
    id: "mh-17",
    category: "crew",
    text: "I avoided speaking up about a concern today.",
    inverted: true,
  },
  {
    id: "mh-18",
    category: "crew",
    text: "Team communication has been clear during this shift.",
  },
  {
    id: "mh-19",
    category: "mood",
    text: "I enjoyed at least one activity outside pure maintenance today.",
  },
  {
    id: "mh-20",
    category: "stress",
    text: "Radiation or environment alerts increased my anxiety.",
    inverted: true,
  },
  {
    id: "mh-21",
    category: "sleep",
    text: "I used sleep aids or extra caffeine to stay on schedule.",
    inverted: true,
  },
  {
    id: "mh-22",
    category: "isolation",
    text: "Messages or recordings from home improved my outlook today.",
  },
  {
    id: "mh-23",
    category: "focus",
    text: "I remembered safety steps without needing extra prompts.",
  },
  {
    id: "mh-24",
    category: "crew",
    text: "I felt supported when I asked for help with a task.",
  },
  {
    id: "mh-25",
    category: "mood",
    text: "I feel proud of how I handled challenges this week.",
  },
  {
    id: "mh-26",
    category: "stress",
    text: "My heart races when I think about upcoming EVA or egress.",
    inverted: true,
  },
  {
    id: "mh-27",
    category: "isolation",
    text: "The habitat feels cramped and mentally draining.",
    inverted: true,
  },
  {
    id: "mh-28",
    category: "focus",
    text: "I could track multiple instruments without mixing them up.",
  },
];

const DEFAULT_SESSION_COUNT = 8;

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Picks 5–10 questions (default 8) spread across categories for one session. */
export function pickSessionQuestions(
  count: number = DEFAULT_SESSION_COUNT,
  seedKey?: string
): MentalHealthQuestion[] {
  const target = Math.min(10, Math.max(5, count));
  const pool = [...MENTAL_HEALTH_QUESTION_POOL];
  const seed = seedKey ?? new Date().toISOString().slice(0, 10);

  pool.sort((a, b) => {
    const ka = hashSeed(`${seed}:${a.id}`);
    const kb = hashSeed(`${seed}:${b.id}`);
    return ka - kb;
  });

  const byCategory = new Map<string, MentalHealthQuestion[]>();
  for (const q of pool) {
    const list = byCategory.get(q.category) ?? [];
    list.push(q);
    byCategory.set(q.category, list);
  }

  const picked: MentalHealthQuestion[] = [];
  const categories = [...byCategory.keys()].sort((a, b) =>
    hashSeed(`${seed}:cat:${a}`) - hashSeed(`${seed}:cat:${b}`)
  );

  for (const cat of categories) {
    if (picked.length >= target) break;
    const next = byCategory.get(cat)?.[0];
    if (next) picked.push(next);
  }

  for (const q of pool) {
    if (picked.length >= target) break;
    if (!picked.some((p) => p.id === q.id)) picked.push(q);
  }

  return picked.slice(0, target);
}

export function compositeWellnessScore(
  questions: MentalHealthQuestion[],
  answers: Record<string, number | undefined>
): number {
  if (questions.length === 0) return 0;
  let sum = 0;
  let n = 0;
  for (const q of questions) {
    const raw = answers[q.id];
    if (raw === undefined || raw < 1 || raw > 5) continue;
    const normalized = q.inverted ? 6 - raw : raw;
    sum += ((normalized - 1) / 4) * 100;
    n += 1;
  }
  if (n === 0) return 0;
  return Math.round(sum / n);
}