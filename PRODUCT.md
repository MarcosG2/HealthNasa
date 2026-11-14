# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, TypeScript, Tailwind CSS, daisyUI, lucide-react, recharts. Inferred from repository (NASA Space Apps 48h PMV).

## Users

Crew members and flight surgeons evaluating astronaut health during Artemis-style missions when ground support is delayed or unavailable. Secondary: judges and demo viewers at NASA Space Apps.

## Product Purpose

Offline-first mission health monitoring: log vitals, see body-system status, trends, and NASA HRP–inspired guidance without blocking on the network.

## Positioning

Clinical evaluation runs deterministically in the browser via `evaluateHealth()`; optional API sync does not gate the UX.

## Operating Context

Long-duration missions across station, spacecraft, rover, and lunar base environments with different latency and hazard profiles. Daily check-ins, scenario simulations for demos, bilingual ES/EN UI.

## Capabilities and Constraints

- Vitals form with streak and routine checklist; body map; timeline charts; rule engine; mock mission history and localStorage persistence.
- Semaphore statuses: normal / warning / critical (emerald, amber, rose).
- No fabricated NASA endorsements; educational copy from project data files.

## Brand Commitments

Product name in metadata: "Mission Health Control | NASA Space Apps". Dark mission-control aesthetic; clear simple English (with Spanish locale toggle).

## Evidence on Hand

Mock mission data (`src/data/mockMissionHistory.ts`), NASA hazard knowledge (`src/data/nasaKnowledge.ts`), no live crew telemetry.

## Product Principles

1. Offline-first for critical evaluation.
2. Types from `src/types/health.ts` as contract.
3. Explain why each measurement matters in space.
4. Lightweight stack—no heavy 3D or realtime DB for PMV.

## Accessibility & Inclusion

Skip link, live regions for status, keyboard-navigable body regions, focus-visible styling.