import { resolve } from "node:path";
import { DEFAULT_CONFIG, type GeneratorConfig } from "./config";
import { generateMissionTelemetry } from "./generate";

function parseArgs(argv: string[]): Partial<GeneratorConfig> {
  const overrides: Partial<GeneratorConfig> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--days" && argv[i + 1]) {
      overrides.missionDays = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--interval-sec" && argv[i + 1]) {
      overrides.sampleIntervalSec = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--output" && argv[i + 1]) {
      overrides.outputPath = argv[i + 1];
      i += 1;
    } else if (arg === "--seed" && argv[i + 1]) {
      overrides.seed = argv[i + 1];
      i += 1;
    } else if (arg === "--env" && argv[i + 1]) {
      overrides.environment = argv[i + 1] as GeneratorConfig["environment"];
      i += 1;
    }
  }
  return overrides;
}

const repoRoot = resolve(import.meta.dirname, "../..");
const config: GeneratorConfig = { ...DEFAULT_CONFIG, ...parseArgs(process.argv.slice(2)) };

const archive = generateMissionTelemetry(config, repoRoot);

console.log(
  `Wrote ${config.outputPath}: ${archive.daily.length} daily rows, ${archive.hot.length} hot samples, ` +
    `${archive.rollups.minute.length} minute rollups, ${archive.rollups.hour.length} hour rollups.`
);