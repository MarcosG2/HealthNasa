# Mission Health Control

**NASA Space Apps Challenge 2026** — Challenge: **Create Health Monitoring Software for Astronauts on Space Missions**

Web dashboard for crew health during long-duration missions. Deterministic evaluation in the browser is inspired by NASA Human Research Program (HRP) thresholds; optional APIs support demos and ground sync.

## Team

- Marcos Guerrero
- Guillermo González
- Pablo Rojas

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
| Client-side evaluator | `src/features/rules-engine/evaluateHealth.ts` |
| Shared health types | `src/types/health.ts` |
| HRP copy & thresholds | `src/data/nasaKnowledge.ts` |

Optional API routes under `src/app/api/` simulate ground sync; core clinical evaluation runs on the client.

## Space agency and partner data

| Agency / source | How we use it |
|-----------------|---------------|
| **NASA — Human Research Program (HRP)** | Hazard and risk education; threshold-inspired rules in `nasaKnowledge.ts` and `evaluateHealth()`. |
| **NASA — DONKI** (`api.nasa.gov/DONKI/FLR`, fallback **CCMC DONKI-API**) | Optional solar-flare (FLR) feed for dashboard alerts (`/api/donki/flr`). |
| **CSA (Canadian Space Agency)** | Public articles on radiation monitoring and ISS science; radiation chart caution line (1.0 mSv/day) in UI copy. |
| **CONAE (Argentina)** | Contextual inspiration only (long-duration crew health and radiation awareness, Artemis II–style narratives); no CONAE API or official dataset in this repo. |

Demo mission telemetry, roster entries, and most ground-sync payloads are **synthetic** unless an API response states otherwise.

## AI and Super Intelligence (SI) disclosure

We used AI-assisted development tools, including **Cursor Agent** and large language models (LLMs), to accelerate parts of this project: TypeScript and Next.js components, refactors, documentation, and **synthetic demo data** with [`@faker-js/faker`](https://github.com/faker-js/faker) and scripted telemetry fixtures.

The team reviewed, integrated, and tested all submissions. Thresholds and escalation logic live in `src/data/nasaKnowledge.ts` and `src/features/rules-engine/evaluateHealth.ts`. This is a **hackathon demo**, not a certified medical device.

## Official references

- [NASA HRP — Spaceflight Hazards](https://www.nasa.gov/hrp/hazards/)
- [NASA HRP — Human Health Risks](https://www.nasa.gov/hrp/risks/)
- [NASA HRP — Ongoing Research](https://www.nasa.gov/hrp/ongoing-hrp-research/)
- [CSA — Monitoring radiation & astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
- [CSA — Science on the ISS](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)

## Public links 

| Resource | URL |
|----------|-----|
| **Live demo** | https://healthnasa.vercel.app/ |
| **Source code** | [github.com/MarcosG2/HealthNasa](https://github.com/MarcosG2/HealthNasa) |
| **Presentation (7 slides, PDF)** |https://drive.google.com/drive/folders/19A_LKwtms3NoYbWPN6110Yi1xnV4bgNr?usp=sharing |



## License

Built for NASA Space Apps 2026 — challenge: *Create Health Monitoring Software for Astronauts on Space Missions*. See repository license if present.
