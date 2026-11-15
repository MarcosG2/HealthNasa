import type { AppLocale } from "@/lib/locale";
import type { MentalHealthQuestion } from "@/types/health";

/** Full pool (~28). Each session surfaces a subset via `pickSessionQuestions`. */
export const MENTAL_HEALTH_QUESTION_POOL: MentalHealthQuestion[] = [
  {
    id: "mh-01",
    category: "mood",
    text: {
      en: "I feel hopeful about completing this mission phase.",
      es: "Siento optimismo sobre completar esta fase de la misión.",
    },
  },
  {
    id: "mh-02",
    category: "mood",
    text: {
      en: "My mood has been stable over the last 24 hours.",
      es: "Mi estado de ánimo ha sido estable en las últimas 24 horas.",
    },
  },
  {
    id: "mh-03",
    category: "mood",
    text: {
      en: "I have felt unusually down or irritable today.",
      es: "Hoy me he sentido inusualmente decaído o irritable.",
    },
    inverted: true,
  },
  {
    id: "mh-04",
    category: "sleep",
    text: {
      en: "I slept long enough to feel restored for duty.",
      es: "Dormí lo suficiente para sentirme recuperado para el servicio.",
    },
  },
  {
    id: "mh-05",
    category: "sleep",
    text: {
      en: "I woke up refreshed rather than groggy.",
      es: "Me desperté descansado, no aturdido.",
    },
  },
  {
    id: "mh-06",
    category: "sleep",
    text: {
      en: "Noise or schedule shifts disrupted my sleep last night.",
      es: "Ruido o cambios de turno interrumpieron mi sueño anoche.",
    },
    inverted: true,
  },
  {
    id: "mh-07",
    category: "isolation",
    text: {
      en: "I feel connected to crewmates even when workloads are heavy.",
      es: "Me siento conectado con la tripulación aunque la carga de trabajo sea alta.",
    },
  },
  {
    id: "mh-08",
    category: "isolation",
    text: {
      en: "Being far from Earth feels overwhelming right now.",
      es: "Estar lejos de la Tierra se siente abrumador en este momento.",
    },
    inverted: true,
  },
  {
    id: "mh-09",
    category: "isolation",
    text: {
      en: "I had a meaningful conversation with at least one crew member today.",
      es: "Tuve una conversación significativa con al menos un tripulante hoy.",
    },
  },
  {
    id: "mh-10",
    category: "stress",
    text: {
      en: "Mission tasks feel manageable with my current energy.",
      es: "Las tareas de la misión se sienten manejables con mi energía actual.",
    },
  },
  {
    id: "mh-11",
    category: "stress",
    text: {
      en: "I feel tense or on edge during routine operations.",
      es: "Me siento tenso o nervioso durante operaciones de rutina.",
    },
    inverted: true,
  },
  {
    id: "mh-12",
    category: "stress",
    text: {
      en: "I can calm myself within a few minutes after a stressful event.",
      es: "Puedo calmarme en pocos minutos después de un evento estresante.",
    },
  },
  {
    id: "mh-13",
    category: "focus",
    text: {
      en: "I can concentrate on checklists without losing my place.",
      es: "Puedo concentrarme en listas de verificación sin perder el lugar.",
    },
  },
  {
    id: "mh-14",
    category: "focus",
    text: {
      en: "My mind wandered so much that I had to redo a task.",
      es: "Mi mente divagó tanto que tuve que repetir una tarea.",
    },
    inverted: true,
  },
  {
    id: "mh-15",
    category: "focus",
    text: {
      en: "I feel mentally sharp enough for time-critical procedures.",
      es: "Me siento mentalmente ágil para procedimientos con tiempo crítico.",
    },
  },
  {
    id: "mh-16",
    category: "crew",
    text: {
      en: "I trust my crew to back me up if something goes wrong.",
      es: "Confío en que la tripulación me respalde si algo sale mal.",
    },
  },
  {
    id: "mh-17",
    category: "crew",
    text: {
      en: "I avoided speaking up about a concern today.",
      es: "Evité expresar una preocupación hoy.",
    },
    inverted: true,
  },
  {
    id: "mh-18",
    category: "crew",
    text: {
      en: "Team communication has been clear during this shift.",
      es: "La comunicación del equipo ha sido clara durante este turno.",
    },
  },
  {
    id: "mh-19",
    category: "mood",
    text: {
      en: "I enjoyed at least one activity outside pure maintenance today.",
      es: "Disfruté al menos una actividad distinta del mantenimiento puro hoy.",
    },
  },
  {
    id: "mh-20",
    category: "stress",
    text: {
      en: "Radiation or environment alerts increased my anxiety.",
      es: "Alertas de radiación o entorno aumentaron mi ansiedad.",
    },
    inverted: true,
  },
  {
    id: "mh-21",
    category: "sleep",
    text: {
      en: "I used sleep aids or extra caffeine to stay on schedule.",
      es: "Usé ayudas para dormir o cafeína extra para mantener el horario.",
    },
    inverted: true,
  },
  {
    id: "mh-22",
    category: "isolation",
    text: {
      en: "Messages or recordings from home improved my outlook today.",
      es: "Mensajes o grabaciones del hogar mejoraron mi perspectiva hoy.",
    },
  },
  {
    id: "mh-23",
    category: "focus",
    text: {
      en: "I remembered safety steps without needing extra prompts.",
      es: "Recordé los pasos de seguridad sin necesitar recordatorios extra.",
    },
  },
  {
    id: "mh-24",
    category: "crew",
    text: {
      en: "I felt supported when I asked for help with a task.",
      es: "Me sentí apoyado cuando pedí ayuda con una tarea.",
    },
  },
  {
    id: "mh-25",
    category: "mood",
    text: {
      en: "I feel proud of how I handled challenges this week.",
      es: "Me siento orgulloso de cómo enfrenté los retos esta semana.",
    },
  },
  {
    id: "mh-26",
    category: "stress",
    text: {
      en: "My heart races when I think about upcoming EVA or egress.",
      es: "Se me acelera el corazón al pensar en la EVA o salida próxima.",
    },
    inverted: true,
  },
  {
    id: "mh-27",
    category: "isolation",
    text: {
      en: "The habitat feels cramped and mentally draining.",
      es: "El hábitat se siente estrecho y agota mentalmente.",
    },
    inverted: true,
  },
  {
    id: "mh-28",
    category: "focus",
    text: {
      en: "I could track multiple instruments without mixing them up.",
      es: "Pude seguir varios instrumentos sin confundirlos.",
    },
  },
];

export function mentalHealthQuestionText(
  question: MentalHealthQuestion,
  locale: AppLocale
): string {
  return question.text[locale];
}

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