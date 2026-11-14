import type { MissionTelemetryArchive, TelemetryHotSample } from "../../src/types/health";

export interface RealtimeStreamOptions {
  /** Milliseconds between samples (default: meta.sampleIntervalSec * 1000) */
  tickMs?: number;
  /** Start offset from the beginning of the hot window (default 0) */
  startIndex?: number;
  loop?: boolean;
}

/**
 * Iterator that replays the hot layer as if samples were arriving in real time.
 * Use in tests or a future live-simulation API route.
 */
export function createRealtimeHotStream(
  archive: MissionTelemetryArchive,
  options: RealtimeStreamOptions = {}
): AsyncGenerator<TelemetryHotSample, void, unknown> {
  const tickMs = options.tickMs ?? archive.meta.sampleIntervalSec * 1000;
  const startIndex = options.startIndex ?? 0;
  const loop = options.loop ?? false;

  async function* run(): AsyncGenerator<TelemetryHotSample, void, unknown> {
    let index = startIndex;
    for (;;) {
      if (index >= archive.hot.length) {
        if (!loop) return;
        index = 0;
      }
      yield archive.hot[index];
      index += 1;
      await new Promise((r) => setTimeout(r, tickMs));
    }
  }

  return run();
}