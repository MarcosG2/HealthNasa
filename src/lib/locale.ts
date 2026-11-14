import type { HealthStatus, SpaceflightHazard } from "@/types/health";
import type { ExamThreshold } from "@/types/health";

export type AppLocale = "es" | "en";

export const LOCALE_STORAGE_KEY = "healthnasa_locale";

export function statusLabelForLocale(
  locale: AppLocale,
  status: HealthStatus
): string {
  const labels: Record<AppLocale, Record<HealthStatus, string>> = {
    es: {
      normal: "Normal",
      warning: "Precaución",
      critical: "Crítico",
    },
    en: {
      normal: "Normal",
      warning: "Needs attention",
      critical: "Critical",
    },
  };
  return labels[locale][status];
}

export function escalationLabel(
  locale: AppLocale,
  level: "self_care" | "crew_attention" | "ground_flight_surgeon"
): string {
  const map: Record<AppLocale, Record<typeof level, string>> = {
    es: {
      self_care: "autocuidado",
      crew_attention: "atención de la tripulación",
      ground_flight_surgeon: "cirujano de vuelo en Tierra",
    },
    en: {
      self_care: "self care",
      crew_attention: "crew attention",
      ground_flight_surgeon: "ground flight surgeon",
    },
  };
  return map[locale][level];
}

export const ENVIRONMENT_LABELS: Record<
  AppLocale,
  Record<
    "station" | "spacecraft" | "rover" | "lunar_base",
    string
  >
> = {
  es: {
    station: "Estación espacial",
    spacecraft: "Nave en tránsito",
    rover: "Rover (gravedad parcial)",
    lunar_base: "Base lunar",
  },
  en: {
    station: "Space station",
    spacecraft: "Transit spacecraft",
    rover: "Rover (partial gravity)",
    lunar_base: "Lunar base",
  },
};

export const BODY_REGION_COPY: Record<
  AppLocale,
  Record<
    "neuro_behavioral" | "cardiovascular" | "metabolic" | "immune_musculoskeletal",
    { label: string; summary: string }
  >
> = {
  es: {
    neuro_behavioral: {
      label: "Cabeza / neuroconductual",
      summary: "Sueño, ánimo, concentración y regulación del estrés.",
    },
    cardiovascular: {
      label: "Corazón / cardiovascular",
      summary: "Presión arterial, frecuencia cardíaca y circulación.",
    },
    metabolic: {
      label: "Abdomen / metabólico",
      summary: "Glucosa, temperatura y balance energético.",
    },
    immune_musculoskeletal: {
      label: "Extremidades / inmune y musculoesquelético",
      summary: "Fuerza, efectos de radiación y recuperación.",
    },
  },
  en: {
    neuro_behavioral: {
      label: "Head / neuro-behavioral",
      summary: "Sleep, mood, focus, and stress regulation.",
    },
    cardiovascular: {
      label: "Heart / cardiovascular",
      summary: "Blood pressure, heart rate, and circulation.",
    },
    metabolic: {
      label: "Abdomen / metabolic",
      summary: "Glucose, temperature, and energy balance.",
    },
    immune_musculoskeletal: {
      label: "Limbs / immune & musculoskeletal",
      summary: "Strength, radiation exposure effects, and recovery.",
    },
  },
};

export const HAZARD_DISPLAY: Record<
  AppLocale,
  Record<
    SpaceflightHazard,
    { title: string; shortDescription: string }
  >
> = {
  es: {
    radiation: {
      title: "Radiación",
      shortDescription:
        "Fuera del campo magnético terrestre, la radiación cósmica y solar aumenta el riesgo a largo plazo.",
    },
    isolation: {
      title: "Aislamiento y confinamiento",
      shortDescription:
        "Tripulaciones pequeñas y lejos de casa pueden afectar sueño, ánimo y coordinación.",
    },
    distance: {
      title: "Distancia desde la Tierra",
      shortDescription:
        "La ayuda desde Tierra llega con retraso; la tripulación debe detectar y responder localmente.",
    },
    gravity: {
      title: "Gravedad alterada",
      shortDescription:
        "La microgravedad y la gravedad lunar cambian fluidos, huesos y músculos.",
    },
    closed_environment: {
      title: "Ambiente cerrado",
      shortDescription:
        "Aire y agua reciclados, ruido y CO₂ pueden afectar sueño y metabolismo.",
    },
  },
  en: {
    radiation: {
      title: "Radiation",
      shortDescription:
        "Outside Earth's magnetic field, cosmic and solar radiation increase long-term health risk.",
    },
    isolation: {
      title: "Isolation & confinement",
      shortDescription:
        "Small crews far from home can affect sleep, mood, and team coordination.",
    },
    distance: {
      title: "Distance from Earth",
      shortDescription:
        "Help from Earth is delayed; crews must detect and respond to health issues locally.",
    },
    gravity: {
      title: "Altered gravity",
      shortDescription:
        "Microgravity and lunar gravity change fluids, bones, and muscles.",
    },
    closed_environment: {
      title: "Closed environment",
      shortDescription:
        "Recycled air and water, noise, and CO₂ can affect sleep and metabolism.",
    },
  },
};

export const MEASUREMENT_GUIDE_LOCALE: Record<
  AppLocale,
  Record<ExamThreshold["metric"], { howTo: string; whySpace: string }>
> = {
  es: {
    systolicBP: {
      howTo: "Siéntate en calma 2 minutos. Usa el brazalete a nivel del corazón. Anota el número superior.",
      whySpace: "Los cambios de fluidos en microgravedad pueden alterar la presión arterial.",
    },
    diastolicBP: {
      howTo: "Usa la misma lectura del brazalete. Anota el número inferior.",
      whySpace: "Ayuda a seguir la adaptación cardiovascular durante la misión.",
    },
    heartRate: {
      howTo: "Cuenta pulsaciones 30 s y multiplica por 2, o usa un wearable.",
      whySpace: "Estrés, carga de trabajo y desacondicionamiento afectan la FC en el espacio.",
    },
    bloodSugar: {
      howTo: "Usa el glucómetro según la ventana de ayuno o comida del protocolo.",
      whySpace: "La dieta y el ejercicio en vuelo pueden cambiar la glucosa.",
    },
    temperature: {
      howTo: "Usa termómetro frontal u ótico según el kit.",
      whySpace: "Fiebre o hipotermia pueden indicar infección en cabina cerrada.",
    },
    sleepHours: {
      howTo: "Estima las horas realmente dormidas en las últimas 24 h.",
      whySpace: "Ciclos de luz y ruido dificultan el sueño en estación o tránsito.",
    },
    moodScore: {
      howTo: "Elige la cara que refleje cómo te sientes hoy (1 = muy bajo, 5 = excelente).",
      whySpace: "El ánimo refleja estrés por aislamiento y ayuda a coordinar la tripulación.",
    },
  },
  en: {
    systolicBP: {
      howTo: "Sit calmly for 2 minutes. Use the automated cuff at heart level. Record the top number.",
      whySpace: "Fluid shifts in microgravity can change blood pressure readings.",
    },
    diastolicBP: {
      howTo: "Use the same cuff reading. Record the bottom number.",
      whySpace: "Helps track cardiovascular adaptation during the mission.",
    },
    heartRate: {
      howTo: "Count beats for 30 seconds and multiply by 2, or use a wearable.",
      whySpace: "Stress, workload, and deconditioning affect heart rate in space.",
    },
    bloodSugar: {
      howTo: "Use a glucose meter after the protocol fast or meal window.",
      whySpace: "Diet changes and exercise schedules can shift glucose in flight.",
    },
    temperature: {
      howTo: "Use the forehead or ear thermometer per kit instructions.",
      whySpace: "Fever or low temperature may signal infection in a closed cabin.",
    },
    sleepHours: {
      howTo: "Estimate time actually asleep during the last 24 hours.",
      whySpace: "Light cycles and noise make sleep harder on station or transit.",
    },
    moodScore: {
      howTo: "Tap the face that matches how you feel today (1 = very low, 5 = great).",
      whySpace: "Mood tracks isolation stress and helps the crew stay coordinated.",
    },
  },
};

export const EVALUATOR_COPY: Record<
  AppLocale,
  {
    systemNormal: string;
    systemWarning: string;
    headlines: {
      ground: string;
      crew: string;
      ok: string;
    };
    guidance: {
      cardio: { why: string; actions: string[] };
      neuro: { why: string; actions: string[] };
      metabolic: { why: string; actions: string[] };
      default: { why: string; actions: string[] };
    };
  }
> = {
  es: {
    systemNormal: "Dentro del rango esperado para esta fase de misión.",
    systemWarning: "Una o más lecturas requieren revisión.",
    headlines: {
      ground: "Escalar al cirujano de vuelo en Tierra",
      crew: "Se recomienda atención médica de tripulación",
      ok: "En curso — mantener rutina diaria",
    },
    guidance: {
      cardio: {
        why: "Los cambios cardiovasculares son comunes en microgravedad, pero picos bruscos requieren acción.",
        actions: [
          "Revisar presión arterial tras 5 minutos de reposo.",
          "Revisar hidratación y ejercicio del día.",
          "Informar al médico de tripulación si se repite la lectura.",
        ],
      },
      neuro: {
        why: "Sueño y ánimo son señales tempranas de estrés por aislamiento en misiones largas.",
        actions: [
          "Proteger una ventana de sueño de 7 h esta noche.",
          "Revisar carga de trabajo con la tripulación.",
          "Usar el protocolo de relajación antes de dormir.",
        ],
      },
      metabolic: {
        why: "Cambios metabólicos pueden reflejar la cabina o una enfermedad incipiente.",
        actions: [
          "Confirmar horarios de comida e hidratación.",
          "Tomar temperatura de nuevo en 30 minutos.",
          "Contactar cirujano en Tierra si persisten fiebre o glucosa alta.",
        ],
      },
      default: {
        why: "Vitales regulares mantienen a la tripulación lista cuando la ayuda desde Tierra está lejos.",
        actions: [
          "Continuar la rutina de registro diario.",
          "Anotar cualquier síntoma nuevo en notas.",
        ],
      },
    },
  },
  en: {
    systemNormal: "Within expected range for this mission phase.",
    systemWarning: "One or more readings need a closer look.",
    headlines: {
      ground: "Escalate to ground flight surgeon",
      crew: "Crew medical attention recommended",
      ok: "On track — maintain daily routine",
    },
    guidance: {
      cardio: {
        why: "Cardiovascular shifts are common in microgravity but sudden spikes need action.",
        actions: [
          "Re-check blood pressure after 5 minutes of rest.",
          "Review hydration and today's exercise completion.",
          "Inform crew medical officer if reading repeats.",
        ],
      },
      neuro: {
        why: "Sleep and mood are early signals of isolation stress on long missions.",
        actions: [
          "Protect a 7-hour sleep window tonight.",
          "Brief crew check-in on workload.",
          "Use relaxation protocol before sleep.",
        ],
      },
      metabolic: {
        why: "Metabolic changes can reflect cabin environment or emerging illness.",
        actions: [
          "Confirm meal timing and hydration log.",
          "Take temperature again in 30 minutes.",
          "Contact ground surgeon if fever or glucose stays high.",
        ],
      },
      default: {
        why: "Regular vitals keep the crew ready when help from Earth is far away.",
        actions: [
          "Continue daily check-in routine.",
          "Log any new symptoms in notes.",
        ],
      },
    },
  },
};

export const UI_STRINGS = {
  es: {
    metaTitle: "Control de salud de misión | NASA Space Apps",
    metaDescription:
      "Monitoreo de salud del astronauta sin conexión para misiones espaciales.",
    appTitle: "Control de salud de misión",
    appSubtitle: "NASA Space Apps — monitoreo del astronauta (offline-first)",
    switchToEnglish: "English",
    simulateCritical: "Simular escenario crítico",
    missionDay: "Día",
    recommendedActions: "Acciones recomendadas",
    escalation: "Escalación",
    missionTimeline: "Línea de tiempo de la misión",
    logVitals: "Registrar signos vitales",
    missionEnvironment: "Entorno de misión",
    chartCardio: "Tendencia cardiovascular",
    chartRecovery: "Recuperación y metabólico",
    chartSystolic: "PA sistólica",
    chartHeartRate: "Frecuencia cardíaca",
    chartSleep: "Sueño (h)",
    chartGlucose: "Glucosa",
    bodyMapHint: "Toca una zona del cuerpo para ver el estado y los riesgos espaciales.",
    bodyMapAria: "Mapa corporal humano interactivo",
    relatedHazards: "Riesgos espaciales relacionados (NASA)",
    dailyCheckIn: "Registro diario",
    streak: "días seguidos — mantén tu rutina",
    stepOf: "Paso",
    of: "de",
    howToMeasure: "Cómo medir",
    whyInSpace: "Por qué importa en el espacio",
    optionalImage: "Imagen opcional (cámara / ecografía)",
    uploadPreview: "Vista previa de imagen",
    back: "Atrás",
    next: "Siguiente",
    saveLog: "Guardar registro de hoy",
    vitals: {
      systolicBP: "PA sistólica",
      diastolicBP: "PA diastólica",
      heartRate: "Frecuencia cardíaca",
      bloodSugar: "Glucosa",
      temperature: "Temperatura",
      sleepHours: "Horas de sueño",
      moodScore: "Ánimo",
    },
    mood: ["Muy bajo", "Bajo", "Regular", "Bien", "Excelente"] as const,
  },
  en: {
    metaTitle: "Mission Health Control | NASA Space Apps",
    metaDescription:
      "Offline-first astronaut health monitoring for space missions.",
    appTitle: "Mission Health Control",
    appSubtitle: "NASA Space Apps — astronaut monitoring (offline-first)",
    switchToEnglish: "Español",
    simulateCritical: "Simulate critical scenario",
    missionDay: "Day",
    recommendedActions: "Recommended actions",
    escalation: "Escalation",
    missionTimeline: "Mission timeline",
    logVitals: "Log vitals",
    missionEnvironment: "Mission environment",
    chartCardio: "Cardiovascular trend",
    chartRecovery: "Recovery & metabolic",
    chartSystolic: "Systolic BP",
    chartHeartRate: "Heart rate",
    chartSleep: "Sleep (h)",
    chartGlucose: "Blood sugar",
    bodyMapHint: "Tap a body region to see status and related space hazards.",
    bodyMapAria: "Interactive human body map",
    relatedHazards: "Related NASA spaceflight hazards",
    dailyCheckIn: "Daily check-in",
    streak: "day streak — keep your routine",
    back: "Back",
    next: "Next",
    saveLog: "Save today's log",
    stepOf: "Step",
    of: "of",
    howToMeasure: "How to measure",
    whyInSpace: "Why in space",
    optionalImage: "Optional image (camera / ultrasound note)",
    uploadPreview: "Upload preview",
    vitals: {
      systolicBP: "Systolic BP",
      diastolicBP: "Diastolic BP",
      heartRate: "Heart rate",
      bloodSugar: "Blood sugar",
      temperature: "Temperature",
      sleepHours: "Sleep hours",
      moodScore: "Mood",
    },
    mood: ["Very low", "Low", "Okay", "Good", "Great"] as const,
  },
} as const;