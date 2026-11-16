import type {
  EnvironmentMissionMeta,
  HealthStatus,
  MissionEnvironment,
  MissionProfile,
  SpaceflightHazard,
  VitalsFormMetric,
} from "@/types/health";

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
  Record<MissionEnvironment, string>
> = {
  es: {
    station: "Estación espacial (LEO)",
    spacecraft: "Nave en tránsito profundo",
    rover: "Rover (Luna / Marte EVA)",
    lunar_base: "Base lunar (polo sur)",
    mars_base: "Base en Marte",
  },
  en: {
    station: "Space station (LEO)",
    spacecraft: "Deep-space transit",
    rover: "Rover (lunar / Mars EVA)",
    lunar_base: "Lunar south-pole base",
    mars_base: "Mars surface base",
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

export const MISSION_PROFILE: Record<AppLocale, MissionProfile> = {
  es: {
    missionName: "Artemis — Misión lunar",
    commanderRole: "Comandante Artemis",
    medicalOfficerRole: "Oficial médico de tripulación",
    program: "NASA Human Research Program (HRP)",
  },
  en: {
    missionName: "Artemis — Lunar mission",
    commanderRole: "Artemis Commander",
    medicalOfficerRole: "Crew Medical Officer",
    program: "NASA Human Research Program (HRP)",
  },
};

export const ENVIRONMENT_MISSION_META: Record<
  AppLocale,
  Record<MissionEnvironment, EnvironmentMissionMeta>
> = {
  es: {
    station: {
      latencyLabel: "~0,5 s (LEO / EEI)",
      latencyMs: 500,
      primaryHazards: ["gravity", "closed_environment"],
      autonomyNote:
        "El retraso es bajo, pero la tripulación debe seguir evaluándose sin depender de Tierra en emergencias.",
      habitatName: "Módulos ISS / Gateway acoplados",
      operationsContext:
        "Microgravedad continua, ciclos de sueño fragmentados y CO₂ de cabina monitorizados por hora.",
      healthFocus:
        "Desacondicionamiento cardiovascular, visión por fluidos y fatiga por ruido/iluminación.",
      scenarioContext:
        "Puedes activar varios escenarios a la vez; la radiación solar suma a la de fondo y el cardio refleja pérdida de volumen.",
    },
    spacecraft: {
      latencyLabel: "4–20 min (ida) — tránsito",
      latencyMs: 600_000,
      primaryHazards: ["radiation", "distance", "isolation"],
      autonomyNote:
        "La telemedicina en tiempo real no es posible; las reglas locales de escalación son obligatorias.",
      habitatName: "Cápsula Orion / nave de tránsito",
      operationsContext:
        "Tripulación reducida, comunicación diferida y GCR elevada fuera del magnetosfera.",
      healthFocus: "Radiación acumulada, estado de ánimo y sueño con turnos largos.",
      scenarioContext:
        "Aislamiento y eventos solares se superponen con frecuencia; la escalación local prevalece sobre Tierra.",
    },
    rover: {
      latencyLabel: "~2,6 s ida y vuelta (EVA lunar)",
      latencyMs: 2600,
      primaryHazards: ["radiation", "gravity"],
      autonomyNote:
        "En superficie, cada minuto cuenta; la autoevaluación guiada reemplaza la respuesta inmediata desde Tierra.",
      habitatName: "Rover presurizado / traje EVA",
      operationsContext:
        "Gravedad parcial (Luna o Marte), polvo, temperatura extrema y ventanas cortas de comunicación.",
      healthFocus:
        "Frecuencia cardíaca con esfuerzo, hidratación en traje y fatiga musculoesquelética.",
      scenarioContext:
        "Cardio por deshidratación y radiación en EVA pueden coexistir; apaga cada escenario sin resetear los demás.",
    },
    lunar_base: {
      latencyLabel: "~2,6 s ida y vuelta (base polo sur)",
      latencyMs: 2600,
      primaryHazards: ["radiation", "isolation", "closed_environment"],
      autonomyNote:
        "La base Artemis opera con latencia; el monitoreo offline-first permite decisiones antes de sincronizar con Tierra.",
      habitatName: "Hábitat Artemis polo sur",
      operationsContext:
        "Noches largas, reciclaje de aire/agua y turnos interiores extendidos.",
      healthFocus: "Sueño circadiano, inmunidad en cabina cerrada y dosis lunar acumulada.",
      scenarioContext:
        "Deriva circadiana y clima cerrado amplifican eventos solares si varios escenarios están encendidos.",
    },
    mars_base: {
      latencyLabel: "8–22 min ida (Marte)",
      latencyMs: 18 * 60 * 1000,
      primaryHazards: ["radiation", "distance", "isolation", "closed_environment"],
      autonomyNote:
        "Marte impone latencia de minutos; la tripulación opera con médico a bordo y reglas HRP locales.",
      habitatName: "Campamento superficie marciana",
      operationsContext:
        "Presión atmosférica baja fuera, polvo perchlorato y comunicaciones no sincrónicas con Tierra.",
      healthFocus:
        "Radiación GCR/SPE, densidad ósea en gravedad reducida y salud conductual en confinamiento largo.",
      scenarioContext:
        "Los tres escenarios simulados son comunes en campamentos marcianos y pueden permanecer activos simultáneamente.",
    },
  },
  en: {
    station: {
      latencyLabel: "~0.5 s (LEO / ISS)",
      latencyMs: 500,
      primaryHazards: ["gravity", "closed_environment"],
      autonomyNote:
        "Delay is low, but crews still need self-assessment when ground support is busy or unavailable.",
      habitatName: "ISS / Gateway stack",
      operationsContext:
        "Continuous microgravity, fragmented sleep cycles, and hourly cabin CO₂ monitoring.",
      healthFocus:
        "Cardiovascular deconditioning, fluid-shift vision issues, and noise/light fatigue.",
      scenarioContext:
        "You can run multiple scenarios together; solar events stack on background dose and cardio reflects volume loss.",
    },
    spacecraft: {
      latencyLabel: "4–20 min one-way — deep transit",
      latencyMs: 600_000,
      primaryHazards: ["radiation", "distance", "isolation"],
      autonomyNote:
        "Real-time telemedicine is not possible; local escalation rules must drive urgent decisions.",
      habitatName: "Orion CM / transit vehicle",
      operationsContext:
        "Small crew, delayed comms, and elevated GCR outside the magnetosphere.",
      healthFocus: "Cumulative radiation, mood, and sleep on long watches.",
      scenarioContext:
        "Isolation and solar storms often overlap; local escalation outruns ground consult.",
    },
    rover: {
      latencyLabel: "~2.6 s round-trip (lunar EVA)",
      latencyMs: 2600,
      primaryHazards: ["radiation", "gravity"],
      autonomyNote:
        "On the surface, minutes matter; guided self-assessment replaces instant ground response.",
      habitatName: "Pressurized rover / EVA suit",
      operationsContext:
        "Partial gravity (Moon or Mars), dust, thermal swings, and narrow comm windows.",
      healthFocus: "Exercise heart rate, suit hydration, and musculoskeletal fatigue.",
      scenarioContext:
        "Dehydration cardio and EVA radiation can run together; turn each scenario off without clearing the others.",
    },
    lunar_base: {
      latencyLabel: "~2.6 s round-trip (south pole base)",
      latencyMs: 2600,
      primaryHazards: ["radiation", "isolation", "closed_environment"],
      autonomyNote:
        "Artemis habitats run with link latency; offline-first monitoring enables action before ground sync.",
      habitatName: "Artemis south-pole habitat",
      operationsContext: "Long nights, air/water recycling, and extended indoor shifts.",
      healthFocus: "Circadian sleep, closed-cabin immunity, and accumulated lunar dose.",
      scenarioContext:
        "Circadian drift and closed ecology amplify solar stress when several simulations are on.",
    },
    mars_base: {
      latencyLabel: "8–22 min one-way (Mars)",
      latencyMs: 18 * 60 * 1000,
      primaryHazards: ["radiation", "distance", "isolation", "closed_environment"],
      autonomyNote:
        "Mars imposes minute-scale delay; crews rely on onboard medical officers and local HRP rules.",
      habitatName: "Mars surface camp",
      operationsContext:
        "Low outdoor pressure, perchlorate dust, and non-synchronous Earth comms.",
      healthFocus:
        "GCR/SPE radiation, bone density at reduced gravity, and behavioral health in long confinement.",
      scenarioContext:
        "All three mission scenarios are plausible on Mars and may stay enabled at the same time.",
    },
  },
};

export const MEASUREMENT_GUIDE_LOCALE: Record<
  AppLocale,
  Record<VitalsFormMetric, { howTo: string; whySpace: string }>
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
    radiationMsv: {
      howTo:
        "Lee la dosis del dosímetro personal o del monitor de cabina. Anota la exposición diaria en mSv.",
      whySpace:
        "Fuera del escudo magnético terrestre, la dosis guía refugios durante eventos de partículas solares.",
    },
    stressLevel: {
      howTo:
        "Califica el estrés percibido de 1 (calma) a 10 (extremo) con la escala de bienestar de la tripulación.",
      whySpace:
        "El aislamiento, la carga de trabajo y la radiación aumentan el estrés; detectarlo temprano protege el rendimiento.",
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
    radiationMsv: {
      howTo:
        "Read today's dose from your dosimeter or cabin monitor. Enter daily exposure in mSv.",
      whySpace:
        "Beyond Earth's magnetic shield, dose tracking drives shelter calls during solar particle events.",
    },
    stressLevel: {
      howTo:
        "Rate perceived stress from 1 (calm) to 10 (extreme) using the crew wellness scale.",
      whySpace:
        "Isolation, workload, and radiation awareness compound stress; early scores guide crew support.",
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

export const MISSION_EVENT_LABELS: Record<AppLocale, Record<string, string>> = {
  es: {
    routine_vitals: "Sincronización de vitales",
    habitat_air_check: "Control de aire de cabina",
    resistive_exercise_block: "Bloque de ejercicio resistivo",
    hydration_protocol: "Protocolo de hidratación",
    solar_particle_watch: "Vigilancia de partículas solares",
    circadian_light_therapy: "Terapia lumínica circadiana",
    ground_sync_window: "Ventana de enlace con Tierra",
    eva_suit_prep: "Preparación de traje EVA",
    autonomous_med_briefing: "Briefing médico autónomo",
    cardio_alert: "Alerta cardiovascular",
    isolation_protocol: "Protocolo de aislamiento",
  },
  en: {
    routine_vitals: "Vitals sync",
    habitat_air_check: "Habitat air check",
    resistive_exercise_block: "Resistive exercise block",
    hydration_protocol: "Hydration protocol",
    solar_particle_watch: "Solar particle watch",
    circadian_light_therapy: "Circadian light therapy",
    ground_sync_window: "Ground sync window",
    eva_suit_prep: "EVA suit prep",
    autonomous_med_briefing: "Autonomous medical briefing",
    cardio_alert: "Cardiovascular alert",
    isolation_protocol: "Isolation protocol",
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
    simulateSolarEvent: "Evento de partículas solares",
    simulateCardioDehydration: "Cardio / deshidratación",
    simulateIsolationDrift: "Aislamiento y ritmo circadiano",
    resetBaseline: "Restablecer línea base",
    artemisProfile: "Perfil de tripulación Artemis",
    communicationLatency: "Latencia de comunicación",
    activeEnvironmentRisks: "Riesgos dominantes del entorno",
    whyAutonomous: "Por qué la autoevaluación autónoma",
    hrpRisksLabel: "Riesgos HRP asociados",
    officialReferences: "Referencias oficiales NASA / CSA",
    projectRepoLink: "Mission Health Control — repositorio en GitHub",
    chartRadiation: "Exposición a radiación (mSv)",
    radiationCautionLine: "Umbral de precaución NASA/CSA (1,0 mSv/día)",
    readinessPoints: "Puntos de preparación",
    dailyCountermeasures: "Contramedidas diarias",
    reactionTest: "Prueba cognitiva de reacción",
    reactionTestHint: "Toca cuando el objetivo se ponga verde esmeralda.",
    reactionStart: "Iniciar prueba",
    reactionWait: "Espera…",
    reactionTap: "¡Ahora!",
    reactionResult: "Tiempo medio (ms)",
    checklistResistiveExercise: "Ejercicio resistivo",
    checklistHydration: "Protocolo de hidratación",
    checklistSleep: "Higiene del sueño",
    checklistRadiation: "Refugio / dosímetro",
    checklistCabin: "CO₂ / temperatura de cabina",
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
    bodyMapHint: "Toca una zona del cuerpo o usa los botones para ver el estado y los riesgos espaciales.",
    bodyMapAria: "Mapa corporal humano interactivo",
    bodyMapTitle: "Estado por sistemas corporales",
    bodyRegionPicker: "Seleccionar región del cuerpo",
    skipToMain: "Ir al contenido principal",
    crewStatusLive: "Estado actual de la tripulación",
    simulationControls: "Simulaciones de misión",
    scenarioActive: "Activo",
    scenarioInactive: "Listo",
    scenarioTapToDeactivate:
      "Varios escenarios pueden estar activos a la vez. Pulsa de nuevo para apagar solo ese escenario.",
    activeScenariosLabel: "Escenarios activos",
    noActiveScenarios: "Ninguno",
    crewRoster: "Tripulación simulada (API)",
    selectAstronaut: "Seleccionar astronauta",
    environmentBrief: "Contexto del entorno",
    habitatLabel: "Hábitat",
    operationsLabel: "Operaciones",
    healthFocusLabel: "Foco de salud",
    mockGroundFeed: "Feed simulado de control en Tierra (Faker API)",
    mockGroundFeedConnected: "Sincronizado",
    donkiAlertTitle: "Alerta DONKI — erupción solar",
    donkiAlertWhy:
      "Las erupciones pueden aumentar partículas solares; fuera del escudo magnético, revisa refugio y dosímetro.",
    donkiQuietTitle: "Sin erupciones solares recientes (DONKI)",
    donkiQuietBody: "Últimas 72 h sin clase M o X que requieran alerta de misión.",
    donkiDataSource: "Fuente espacio clima",
    donkiSourceNasa: "NASA DONKI (api.nasa.gov)",
    donkiSourceCcmc: "CCMC DONKI-API",
    donkiSourceMock: "API ficticia de demostración",
    donkiClassLabel: "Clase GOES",
    donkiRegionLabel: "Región activa",
    donkiViewEvent: "Ver en DONKI",
    donkiSeverityWatch: "Vigilancia",
    donkiSeverityWarning: "Atención",
    donkiSeverityCritical: "Crítico",
    bodyRegionSelected: "Seleccionado",
    vitalsFileLabel: "Adjuntar imagen opcional",
    stressValueLabel: "Nivel de estrés seleccionado",
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
    quickFillNormal: "Relleno rápido (valores normales)",
    referenceRange: "Rango de referencia",
    lastVisualInspection: "Última inspección visual / adjunto",
    noVisualAttachment: "Sin imagen adjunta aún.",
    groundSyncSimulated:
      "Sincronización con Tierra simulada (latencia: {latency})",
    chartPointHint:
      "En Días: toca un punto para ver las 24 horas de ese día. En Horas: toca una franja para ver los minutos.",
    chartPointHintPanels:
      "Cada gráfico tiene su escala. Cardio: Día→Minuto→5 s. Recuperación/metabólico: Día u Horas. Radiación: Día u Horas.",
    cardioScaleDay: "Día",
    cardioScaleMinute: "1 min",
    cardioScale5sec: "5 s",
    cardioHintDay:
      "Banda min–máx de FC: picos altos sugieren ejercicio; mínimos elevados o max >160 pueden anticipar alerta.",
    cardioHintMinute: "Un punto por minuto del día seleccionado (actividad y eventos agudos).",
    cardioHint5sec: "Últimas 24 h del archivo o la hora elegida — para ver evolución rápida de una afección.",
    cardioScaleNeedsDay: "Elegí el día de misión en el selector o tocá un punto en la vista Diaria.",
    recoveryScaleDay: "Día",
    recoveryScaleHour: "Hora",
    recoveryHintDay:
      "Sueño + estrés diarios: tendencias de fatiga circadiana y aislamiento (NASA behavioral health).",
    recoveryHintHour:
      "Glucosa y ánimo por hora: picos metabólicos y bajón de ánimo el mismo día.",
    recoveryScaleNeedsDay: "Elegí un día en la vista diaria de recuperación (toca un punto).",
    radiationScaleDay: "Día",
    radiationScaleHour: "Hora",
    radiationHintDay: "Dosis diaria y acumulado de misión (mSv) frente al umbral de precaución.",
    radiationHintHour: "Dosis por hora UTC en el día seleccionado; la línea rosada suma el día.",
    radiationScaleNeedsDay: "Elegí el día de misión en el selector o tocá un punto en la vista Diaria.",
    chartHeartRateMin: "FC mínima",
    chartHeartRateMax: "FC máxima",
    chartHeartRateAvg: "FC media",
    chartStress: "Estrés (1–10)",
    chartMood: "Ánimo (1–5)",
    chartRadiationCumulative: "Acumulado misión (mSv)",
    chartRadiationCumulativeDay: "Acumulado del día (mSv)",
    chartTimeScale: "Escala de tiempo",
    chartScaleMinutes: "Minutos",
    chartScaleHours: "Horas",
    chartScaleDays: "Días",
    chartScaleHintMinutes: "Zoom de 5 min en la hora UTC seleccionada",
    chartScaleHintHours: "24 horas del día de misión en revisión",
    chartScaleHintDays: "Un punto por día de misión (vista mensual usa rollups agregados)",
    chartScaleHoursLocked: "Selecciona un día en el gráfico primero",
    chartScaleMinutesLocked: "Selecciona una hora en el gráfico primero",
    bodyReplayAtTop: "Estado corporal en el instante seleccionado",
    crewStatusReview: "Modo revisión",
    chartMissionDayPick: "Día de misión",
    load30DayArchive: "Cargar archivo 60 días",
    load30DayArchiveLoading: "Cargando…",
    load30DayArchiveLoaded: "Archivo 60 días activo",
    load30DayArchiveMissing: "No se encontró mission-telemetry-60d.json (npm run generate:telemetry)",
    vitalsReadOnlyInReplay: "Registro de vitales bloqueado durante la revisión histórica.",
    dayReplayTitle: "Instante de misión (revisión)",
    dayEventsLabel: "Eventos del día",
    measuredAtEnvironment: "Entorno de la medición",
    intradayChartHint: "Variación intradía (muestras cada ~60 min, hora UTC)",
    sectorsUpdatedEnvironment:
      "Entorno actualizado. Los sectores que cambiaron brillan un momento.",
    sectorsUpdatedCrew:
      "Tripulante actualizado. Los sectores de la misión se refrescaron.",
    sectorsUpdatedScenario:
      "Escenario actualizado. Los sectores afectados se refrescaron.",
    sectorsUpdatedBaseline:
      "Línea base restaurada. Los sectores de la misión se refrescaron.",
    replayModeBanner:
      "Modo revisión histórica — las simulaciones están bloqueadas hasta volver al presente.",
    returnToNow: "Volver al presente",
    vitals: {
      systolicBP: "PA sistólica",
      diastolicBP: "PA diastólica",
      heartRate: "Frecuencia cardíaca",
      bloodSugar: "Glucosa",
      temperature: "Temperatura",
      sleepHours: "Horas de sueño",
      moodScore: "Ánimo",
      radiationMsv: "Radiación (mSv)",
      stressLevel: "Nivel de estrés",
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
    simulateSolarEvent: "Solar particle event",
    simulateCardioDehydration: "Cardio / dehydration",
    simulateIsolationDrift: "Isolation & circadian drift",
    resetBaseline: "Reset mission baseline",
    artemisProfile: "Artemis crew profile",
    communicationLatency: "Communication latency",
    activeEnvironmentRisks: "Dominant environment risks",
    whyAutonomous: "Why autonomous self-assessment",
    hrpRisksLabel: "Associated HRP risks",
    officialReferences: "Official NASA / CSA references",
    projectRepoLink: "Mission Health Control — GitHub repository",
    chartRadiation: "Radiation exposure (mSv)",
    radiationCautionLine: "NASA/CSA caution threshold (1.0 mSv/day)",
    readinessPoints: "Readiness points",
    dailyCountermeasures: "Daily countermeasures",
    reactionTest: "Cognitive reaction test",
    reactionTestHint: "Tap when the target turns emerald green.",
    reactionStart: "Start test",
    reactionWait: "Wait…",
    reactionTap: "Tap now!",
    reactionResult: "Average time (ms)",
    checklistResistiveExercise: "Resistive exercise",
    checklistHydration: "Hydration protocol",
    checklistSleep: "Sleep hygiene",
    checklistRadiation: "Radiation shelter / dosimeter",
    checklistCabin: "Cabin CO₂ / temperature",
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
    bodyMapHint: "Tap a body region or use the buttons below to see status and related space hazards.",
    bodyMapAria: "Interactive human body map",
    bodyMapTitle: "Status by body system",
    bodyRegionPicker: "Select body region",
    skipToMain: "Skip to main content",
    crewStatusLive: "Current crew status",
    simulationControls: "Mission simulations",
    scenarioActive: "Active",
    scenarioInactive: "Ready",
    scenarioTapToDeactivate:
      "Multiple scenarios can run together. Tap again to turn off only that scenario.",
    activeScenariosLabel: "Active scenarios",
    noActiveScenarios: "None",
    crewRoster: "Simulated crew (API)",
    selectAstronaut: "Select astronaut",
    environmentBrief: "Environment context",
    habitatLabel: "Habitat",
    operationsLabel: "Operations",
    healthFocusLabel: "Health focus",
    mockGroundFeed: "Mock ground-control feed (Faker API)",
    mockGroundFeedConnected: "Synced",
    donkiAlertTitle: "DONKI alert — solar flare",
    donkiAlertWhy:
      "Flares can raise solar particle flux; beyond Earth's magnetosphere, check shelter and dosimeter.",
    donkiQuietTitle: "No recent solar flares (DONKI)",
    donkiQuietBody: "No class M or X flare in the last 72 h that triggers a mission alert.",
    donkiDataSource: "Space weather source",
    donkiSourceNasa: "NASA DONKI (api.nasa.gov)",
    donkiSourceCcmc: "CCMC DONKI-API",
    donkiSourceMock: "Demo mock ground API",
    donkiClassLabel: "GOES class",
    donkiRegionLabel: "Active region",
    donkiViewEvent: "Open in DONKI",
    donkiSeverityWatch: "Watch",
    donkiSeverityWarning: "Attention",
    donkiSeverityCritical: "Critical",
    bodyRegionSelected: "Selected",
    vitalsFileLabel: "Attach optional image",
    stressValueLabel: "Selected stress level",
    relatedHazards: "Related NASA spaceflight hazards",
    dailyCheckIn: "Daily check-in",
    streak: "day streak — keep your routine",
    back: "Back",
    next: "Next",
    saveLog: "Save today's log",
    quickFillNormal: "Quick fill normal",
    referenceRange: "Reference range",
    lastVisualInspection: "Last visual inspection / ground attachment",
    noVisualAttachment: "No image attached yet.",
    groundSyncSimulated: "Ground sync simulated (latency: {latency})",
    chartPointHint:
      "On Days: tap a point to open that day’s 24 hours. On Hours: tap a band to open minute-level zoom.",
    chartPointHintPanels:
      "Each chart has its own scale. Cardio: Day→Minute→5 s. Recovery: Day or Hours. Radiation: Day or Hours.",
    cardioScaleDay: "Day",
    cardioScaleMinute: "1 min",
    cardioScale5sec: "5 s",
    cardioHintDay:
      "HR min–max band: high peaks suggest exercise; raised mins or max >160 may signal escalation.",
    cardioHintMinute: "One point per minute for the selected day (activity and acute events).",
    cardioHint5sec: "Hot archive or selected hour — watch a condition evolve in near real time.",
    cardioScaleNeedsDay: "Pick a day on the Day view (tap a point) or load the 30-day archive.",
    recoveryScaleDay: "Day",
    recoveryScaleHour: "Hour",
    recoveryHintDay:
      "Daily sleep + stress: circadian fatigue and isolation drift (NASA behavioral health).",
    recoveryHintHour: "Hourly glucose and mood on the selected day for metabolic and mood swings.",
    recoveryScaleNeedsDay: "Pick a day on the recovery day view (tap a point).",
    radiationScaleDay: "Day",
    radiationScaleHour: "Hour",
    radiationHintDay: "Daily dose and mission cumulative (mSv) vs caution threshold.",
    radiationHintHour: "Dose per UTC hour on the selected day; pink line is running day total.",
    radiationScaleNeedsDay: "Pick a mission day in the selector or tap a point on the Day view.",
    chartHeartRateMin: "HR minimum",
    chartHeartRateMax: "HR maximum",
    chartHeartRateAvg: "HR average",
    chartStress: "Stress (1–10)",
    chartMood: "Mood (1–5)",
    chartRadiationCumulative: "Mission cumulative (mSv)",
    chartRadiationCumulativeDay: "Day running total (mSv)",
    chartTimeScale: "Time scale",
    chartScaleMinutes: "Minutes",
    chartScaleHours: "Hours",
    chartScaleDays: "Days",
    chartScaleHintMinutes: "5-minute zoom for the selected UTC hour",
    chartScaleHintHours: "24 hours for the mission day under review",
    chartScaleHintDays: "One point per mission day (month view uses aggregated rollups)",
    chartScaleHoursLocked: "Select a day on the chart first",
    chartScaleMinutesLocked: "Select an hour on the chart first",
    bodyReplayAtTop: "Body status at selected moment",
    crewStatusReview: "Review mode",
    chartMissionDayPick: "Mission day",
    load30DayArchive: "Load 60-day archive",
    load30DayArchiveLoading: "Loading…",
    load30DayArchiveLoaded: "60-day archive active",
    load30DayArchiveMissing: "mission-telemetry-60d.json not found (run npm run generate:telemetry)",
    vitalsReadOnlyInReplay: "Vitals logging is locked while reviewing history.",
    dayReplayTitle: "Mission snapshot (review)",
    dayEventsLabel: "Day events",
    measuredAtEnvironment: "Measurement environment",
    intradayChartHint: "Intraday trend (~60 min samples, UTC time axis)",
    sectorsUpdatedEnvironment:
      "Environment updated. Sectors that changed glow for a moment.",
    sectorsUpdatedCrew: "Crew member updated. Mission sectors were refreshed.",
    sectorsUpdatedScenario: "Scenario updated. Affected sectors were refreshed.",
    sectorsUpdatedBaseline: "Baseline restored. Mission sectors were refreshed.",
    replayModeBanner:
      "Historical review mode — simulations stay locked until you return to now.",
    returnToNow: "Return to now",
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
      radiationMsv: "Radiation (mSv)",
      stressLevel: "Stress level",
    },
    mood: ["Very low", "Low", "Okay", "Good", "Great"] as const,
  },
} as const;