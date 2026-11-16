# Mission Health Control

-first astronaut health monitoring demo for **NASA Space Apps Challenge**. The browser runs deterministic evaluation inspired by NASA Human Research Program (HRP) thresholds—no blocking API required for core UX.

## Features

- **Mission dashboard** — crew profile, communication latency, and environment-specific hazards
- **Body map** — status by body system with linked NASA hazard education
- **Mission timeline charts** — 14-day cardiovascular, recovery, and radiation trends
- **Crew wellness** — cognitive/mental check-in, daily countermeasure checklist, and reaction-time drill
- **Rules engine** — `evaluateHealth()` with escalation: self-care → crew → ground flight surgeon
- **Mission scenarios** — solar particles, cardio/dehydration, isolation (stackable simulations)

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, daisyUI, `lucide-react`, Recharts.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # local development
npm run build    # production build (run before deploy)
npm run lint     # ESLint
```

## Architecture

| Area | Path |
|------|------|
| Dashboard shell | `src/features/dashboard/` |
| Body map | `src/features/body-map/` |
| Charts | `src/features/timeline/` |
| Wellness & routines | `src/features/vitals-form/` |
| Offline evaluator | `src/features/rules-engine/evaluateHealth.ts` |
| Shared health types | `src/types/health.ts` |
| HRP copy & thresholds | `src/data/nasaKnowledge.ts` |

Optional API routes under `src/app/api/` simulate ground sync; clinical evaluation remains client-side.

## Official references

- [NASA HRP — Spaceflight Hazards](https://www.nasa.gov/hrp/hazards/)
- [NASA HRP — Human Health Risks](https://www.nasa.gov/hrp/risks/)
- [NASA HRP — Ongoing Research](https://www.nasa.gov/hrp/ongoing-hrp-research/)
- [CSA — Monitoring radiation & astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
- [CSA — Science on the ISS](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)

## License

Built for NASA Space Apps 2026. See repository license if present.
