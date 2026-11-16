# Mission telemetry generator

Generates a **layered** astronaut dataset for long missions without shipping ~500k raw points to the browser.

## Layers

| Layer | Contents | Use |
|-------|-----------|-----|
| **Daily** | 1 `VitalReadings` per mission day | Month chart (`days`) |
| **Hour rollups** | avg / min / max HR per UTC hour | Day chart (`hours`) |
| **Minute rollups** | avg / min / max HR per minute | Historical minute zoom |
| **Hot (24 h)** | Raw 5 s samples for the last mission day window | Real-time replay & anomaly detail |

## Heart rate model

- **Circadian**: ~65–75 bpm during sleep (22:00–06:00 UTC), ~80–95 bpm awake.
- **Activity blocks**: ~120–150 bpm during scheduled exercise windows.
- **Anomalies**: configurable spikes (default: mission day 15 at 00:12 UTC).

Edit `config.ts` (`missionDays`, `anomalies`, `activityBlocksUtc`, etc.).

## Commands

```bash
npm run generate:telemetry
npm run generate:telemetry -- --days 7 --output public/data/mission-telemetry-7d.json
npm run generate:telemetry -- --interval-sec 5 --seed my-run-2
```

Output default: `public/data/mission-telemetry-30d.json` (served at `/data/mission-telemetry-30d.json`).

## Real-time simulation

`realtimeStream.ts` exposes `createRealtimeHotStream(archive)` — an async generator that yields hot-layer samples on the configured interval. Wire it to a future API route or test harness.

## App integration

`MissionDashboard` fetches the archive when present and passes it to `HealthCharts` / `buildChartTimeline`, which select rollups or hot downsamples instead of synthesizing full-resolution data in the client.