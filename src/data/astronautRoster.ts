import type {
  AstronautHealthArchetype,
  MockAstronautProfile,
  MissionScenarioId,
  VitalReadings,
} from "@/types/health";

export const ASTRONAUT_ROSTER: MockAstronautProfile[] = [
  {
    id: "eva-chen",
    callSign: "Starwalker-1",
    fullName: "Dr. Mei Chen",
    agency: "NASA",
    role: "ISS Commander",
    archetype: "healthy",
    homeEnvironment: "station",
    typicalScenarios: [],
  },
  {
    id: "luna-okafor",
    callSign: "Southpole-7",
    fullName: "Amara Okafor",
    agency: "CSA",
    role: "Lunar habitat engineer",
    archetype: "healthy",
    homeEnvironment: "lunar_base",
    typicalScenarios: [],
  },
  {
    id: "rover-torres",
    callSign: "Dustline-3",
    fullName: "Isabel Torres",
    agency: "ESA",
    role: "Lunar rover driver",
    archetype: "isolation_stress",
    homeEnvironment: "rover",
    typicalScenarios: ["isolation"],
  },
  {
    id: "mars-patel",
    callSign: "Olympus-2",
    fullName: "Ravi Patel",
    agency: "NASA",
    role: "Mars base geologist",
    archetype: "radiation_exposure",
    homeEnvironment: "mars_base",
    typicalScenarios: ["solar"],
  },
  {
    id: "cardio-sato",
    callSign: "Gateway-9",
    fullName: "Kenji Sato",
    agency: "JAXA",
    role: "Flight surgeon",
    archetype: "cardio_warning",
    homeEnvironment: "station",
    typicalScenarios: ["cardio"],
  },
  {
    id: "transit-berg",
    callSign: "Voidrunner",
    fullName: "Ingrid Berg",
    agency: "ESA",
    role: "Deep-space pilot",
    archetype: "isolation_stress",
    homeEnvironment: "spacecraft",
    typicalScenarios: ["isolation", "solar"],
  },
  {
    id: "metabolic-roy",
    callSign: "Artemis-412",
    fullName: "Camille Roy",
    agency: "CSA",
    role: "Life-support officer",
    archetype: "metabolic_drift",
    homeEnvironment: "lunar_base",
    typicalScenarios: ["cardio"],
  },
  {
    id: "compound-alvarez",
    callSign: "Redline-1",
    fullName: "Diego Álvarez",
    agency: "NASA",
    role: "Mars EVA lead",
    archetype: "multi_system_critical",
    homeEnvironment: "mars_base",
    typicalScenarios: ["solar", "cardio", "isolation"],
  },
  {
    id: "healthy-mars-lee",
    callSign: "Hellas-5",
    fullName: "Jordan Lee",
    agency: "NASA",
    role: "Mars botanist",
    archetype: "healthy",
    homeEnvironment: "mars_base",
    typicalScenarios: [],
  },
  {
    id: "rover-healthy-kim",
    callSign: "Rille-8",
    fullName: "Hana Kim",
    agency: "JAXA",
    role: "Rover systems",
    archetype: "healthy",
    homeEnvironment: "rover",
    typicalScenarios: [],
  },
];

export function getAstronautById(id: string): MockAstronautProfile | undefined {
  return ASTRONAUT_ROSTER.find((a) => a.id === id);
}

const ARCHETYPE_LABEL: Record<
  AstronautHealthArchetype,
  { es: string; en: string }
> = {
  healthy: { es: "En rango", en: "Within range" },
  cardio_warning: { es: "Alerta cardiovascular", en: "Cardiovascular alert" },
  radiation_exposure: { es: "Radiación elevada", en: "Elevated radiation" },
  isolation_stress: { es: "Estrés / aislamiento", en: "Isolation stress" },
  metabolic_drift: { es: "Deriva metabólica", en: "Metabolic drift" },
  multi_system_critical: { es: "Multisistema crítico", en: "Multi-system critical" },
};

export function archetypeLabel(
  archetype: AstronautHealthArchetype,
  locale: "es" | "en"
): string {
  return ARCHETYPE_LABEL[archetype][locale];
}

/** Shape telemetry to match roster archetype (last missions days). */
export function applyAstronautArchetype(
  telemetry: VitalReadings[],
  archetype: AstronautHealthArchetype,
  typicalScenarios: MissionScenarioId[]
): VitalReadings[] {
  if (telemetry.length === 0) return telemetry;
  const rows = telemetry.map((r) => ({ ...r }));
  const last = rows[rows.length - 1];
  const prev = rows.length > 1 ? rows[rows.length - 2] : last;

  switch (archetype) {
    case "healthy":
      last.systolicBP = Math.min(last.systolicBP, 122);
      last.heartRate = Math.min(last.heartRate, 78);
      last.stressLevel = Math.min(last.stressLevel ?? 5, 4);
      break;
    case "cardio_warning":
      last.systolicBP = 152;
      last.diastolicBP = 96;
      last.heartRate = 108;
      prev.systolicBP = 138;
      break;
    case "radiation_exposure":
      last.radiationMsv = 1.35;
      prev.radiationMsv = 0.95;
      last.heartRate = Math.max(last.heartRate, 96);
      last.extraMetrics = { ...last.extraMetrics, fatigueLevel: "elevated" };
      break;
    case "isolation_stress":
      last.sleepHours = 4.2;
      last.moodScore = 2;
      last.stressLevel = 8;
      last.extraMetrics = { ...last.extraMetrics, reactionTimeMs: 520 };
      break;
    case "metabolic_drift":
      last.bloodSugar = 158;
      last.temperature = 37.4;
      prev.bloodSugar = 132;
      break;
    case "multi_system_critical":
      last.systolicBP = 168;
      last.heartRate = 118;
      last.radiationMsv = 1.6;
      last.sleepHours = 3.5;
      last.stressLevel = 9;
      last.moodScore = 1;
      last.extraMetrics = {
        fatigueLevel: "elevated",
        reactionTimeMs: 580,
      };
      break;
  }

  last.extraMetrics = {
    ...last.extraMetrics,
    rosterArchetype: archetype,
    typicalScenarios: typicalScenarios.join(","),
  };

  return rows;
}