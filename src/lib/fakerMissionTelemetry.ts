import { faker } from "@faker-js/faker";
import {
  applyAstronautArchetype,
  getAstronautById,
  ASTRONAUT_ROSTER,
} from "@/data/astronautRoster";
import { buildMockMissionHistory } from "@/data/mockMissionHistory";
import type {
  MissionEnvironment,
  MockAstronautProfile,
  VitalReadings,
} from "@/types/health";

export interface MockGroundCrew {
  callSign: string;
  commander: string;
  medicalOfficer: string;
  agency: string;
  habitatModule: string;
  astronautId?: string;
  archetype?: MockAstronautProfile["archetype"];
}

export interface FakerMissionFeed {
  feedId: string;
  generatedAt: string;
  environment: MissionEnvironment;
  days: number;
  crew: MockGroundCrew;
  signalLatencyMs: number;
  telemetry: VitalReadings[];
  rosterSize: number;
}

function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const LATENCY_MS: Record<MissionEnvironment, number> = {
  station: 500,
  spacecraft: 12 * 60 * 1000,
  rover: 2600,
  lunar_base: 2600,
  mars_base: 18 * 60 * 1000,
};

const HABITAT_BY_ENV: Record<MissionEnvironment, string[]> = {
  station: ["ISS USOS", "Columbus", "Kibo"],
  spacecraft: ["Orion CM", "Deep Space Transport", "Gateway HALO"],
  rover: ["Artemis LTV", "PRESS Lunar Rover", "Mars Science Rover"],
  lunar_base: ["Artemis South Pole Habitat", "Lunar Gateway Logistics"],
  mars_base: ["Mars Ice Home", "Olympus Mons Camp", "Hellas Planitia Lab"],
};

/** Server-only synthetic ground feed — seeds Faker, layers noise on HRP-shaped baselines. */
export function buildFakerMissionFeed(
  environment: MissionEnvironment,
  days: number,
  seed?: string,
  astronautId?: string
): FakerMissionFeed {
  const rosterEntry = astronautId ? getAstronautById(astronautId) : undefined;
  /** User-selected mission context; do not override with crew home habitat. */
  const env = environment;
  const seedValue = seed ?? `${astronautId ?? "crew"}-${env}-${days}`;
  faker.seed(seedFromString(seedValue));

  let baseline = buildMockMissionHistory(env).slice(0, days).map((row) => ({
    ...row,
    environment: env,
    systolicBP: row.systolicBP + faker.number.int({ min: -3, max: 3 }),
    diastolicBP: row.diastolicBP + faker.number.int({ min: -2, max: 2 }),
    heartRate: row.heartRate + faker.number.int({ min: -4, max: 4 }),
    bloodSugar: row.bloodSugar + faker.number.int({ min: -5, max: 5 }),
    temperature:
      Math.round((row.temperature + faker.number.float({ min: -0.15, max: 0.15 })) * 10) /
      10,
    sleepHours:
      Math.round((row.sleepHours + faker.number.float({ min: -0.3, max: 0.3 })) * 10) / 10,
    recordedAt: row.recordedAt,
  }));

  if (rosterEntry) {
    baseline = applyAstronautArchetype(
      baseline,
      rosterEntry.archetype,
      rosterEntry.typicalScenarios
    );
    const last = baseline[baseline.length - 1];
    if (last) {
      last.extraMetrics = {
        ...last.extraMetrics,
        astronautId: rosterEntry.id,
      };
    }
  }

  const crewName = rosterEntry?.fullName ?? faker.person.fullName();
  const callSign = rosterEntry?.callSign ?? `Artemis-${faker.number.int({ min: 410, max: 420 })}`;

  return {
    feedId: faker.string.uuid(),
    generatedAt: new Date().toISOString(),
    environment: env,
    days,
    signalLatencyMs: LATENCY_MS[env],
    rosterSize: ASTRONAUT_ROSTER.length,
    crew: {
      callSign,
      commander: crewName,
      medicalOfficer: rosterEntry?.role ?? faker.person.fullName(),
      agency: rosterEntry?.agency ?? faker.helpers.arrayElement(["NASA", "CSA", "ESA", "JAXA"]),
      habitatModule: faker.helpers.arrayElement(HABITAT_BY_ENV[env]),
      astronautId: rosterEntry?.id,
      archetype: rosterEntry?.archetype,
    },
    telemetry: baseline,
  };
}

export function listRosterForApi(): MockAstronautProfile[] {
  return ASTRONAUT_ROSTER;
}