import type { ExamThreshold, HazardKnowledgeBlock } from "@/types/health";

const HRP_HAZARDS_URL = "https://www.nasa.gov/hrp/hazards/";
const HRP_RISKS_URL = "https://www.nasa.gov/hrp/risks/";
const HRP_ONGOING_URL = "https://www.nasa.gov/hrp/ongoing-hrp-research/";
const CSA_RADIATION_URL =
  "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp";
const CSA_ISS_SCIENCE_URL =
  "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp";

export const NASA_HAZARDS_KNOWLEDGE: HazardKnowledgeBlock[] = [
  {
    hazard: "radiation",
    title: "Radiation",
    shortDescription:
      "Outside Earth's magnetic field, cosmic and solar radiation increase long-term health risk.",
    whyMonitorInSpace:
      "Radiation can affect blood cells and immune response. Tracking vitals and optional dose helps spot early problems.",
    whatCanBeMeasured: [
      "Optional daily radiation dose (mSv)",
      "Heart rate and blood pressure trends",
      "Sleep and mood (stress from exposure awareness)",
    ],
    preventiveActions: [
      "Shelter in shielded modules during solar particle events",
      "Keep sleep and hydration routines stable",
      "Report fatigue or unusual bruising to the crew medical officer",
    ],
    relatedSystems: ["immune_musculoskeletal", "metabolic"],
    hrpRisks: [
      "Radiation carcinogenesis",
      "Acute radiation syndromes (SPE events)",
      "Altered immune response",
    ],
    officialLinks: [
      { label: "NASA HRP — Spaceflight Hazards", url: HRP_HAZARDS_URL },
      { label: "CSA — Monitoring radiation & astronaut health", url: CSA_RADIATION_URL },
    ],
  },
  {
    hazard: "isolation",
    title: "Isolation & confinement",
    shortDescription:
      "Small crews far from home can affect sleep, mood, and team coordination.",
    whyMonitorInSpace:
      "Mood, sleep, and neuro-ocular signs (SANS) are early stress indicators. Catching trends early helps the crew support each other.",
    whatCanBeMeasured: [
      "Mood score (1–5)",
      "Stress level (1–10)",
      "Sleep hours",
      "Heart rate at rest",
      "Vision / neuro-ocular self-checks (SANS)",
    ],
    preventiveActions: [
      "Keep a daily check-in routine",
      "Use scheduled communication with family or ground",
      "Balance workload and rest periods",
    ],
    relatedSystems: ["neuro_behavioral"],
    hrpRisks: [
      "Behavioral health & performance",
      "Team cohesion & psychosocial adaptation",
      "Sleep deficiency",
    ],
    officialLinks: [
      { label: "NASA HRP — Spaceflight Hazards", url: HRP_HAZARDS_URL },
      { label: "NASA HRP — Human Health Risks", url: HRP_RISKS_URL },
    ],
  },
  {
    hazard: "distance",
    title: "Distance from Earth",
    shortDescription:
      "Help from Earth is delayed; crews must detect and respond to health issues locally.",
    whyMonitorInSpace:
      "Clear thresholds and escalation rules let the crew act without waiting for real-time surgery support.",
    whatCanBeMeasured: [
      "Full daily vitals panel",
      "Trends over mission days",
      "Optional images for ground review when link is available",
    ],
    preventiveActions: [
      "Follow escalation: self-care → crew → flight surgeon",
      "Document every abnormal reading",
      "Run simulations for urgent scenarios",
    ],
    relatedSystems: [
      "cardiovascular",
      "neuro_behavioral",
      "metabolic",
      "immune_musculoskeletal",
    ],
    hrpRisks: [
      "Inadequate medical capabilities",
      "Behavioral health under delayed Earth support",
      "Mission-critical autonomous decision-making",
    ],
    officialLinks: [
      { label: "NASA HRP — Spaceflight Hazards", url: HRP_HAZARDS_URL },
      { label: "NASA HRP — Ongoing research", url: HRP_ONGOING_URL },
    ],
  },
  {
    hazard: "gravity",
    title: "Altered gravity",
    shortDescription:
      "Microgravity and lunar gravity change fluids, bones, and muscles.",
    whyMonitorInSpace:
      "Blood pressure and heart rate shift as the body adapts. Metabolic signs can change with exercise load.",
    whatCanBeMeasured: [
      "Blood pressure and heart rate",
      "Blood sugar (after meals)",
      "Exercise notes in extra metrics",
    ],
    preventiveActions: [
      "Complete daily resistive exercise",
      "Hydrate per flight surgeon protocol",
      "Monitor dizziness when standing in partial gravity",
    ],
    relatedSystems: ["cardiovascular", "immune_musculoskeletal", "metabolic"],
    hrpRisks: [
      "Cardiovascular deconditioning",
      "Bone loss & muscle atrophy",
      "Sensorimotor adaptation",
    ],
    officialLinks: [
      { label: "NASA HRP — Spaceflight Hazards", url: HRP_HAZARDS_URL },
      { label: "NASA HRP — Human Health Risks", url: HRP_RISKS_URL },
    ],
  },
  {
    hazard: "closed_environment",
    title: "Closed environment",
    shortDescription:
      "Recycled air and water, elevated CO₂, and noise can affect sleep, metabolism, and mild hypoxia symptoms.",
    whyMonitorInSpace:
      "Temperature, hydration, and blood sugar help detect dehydration or poor recovery in the cabin.",
    whatCanBeMeasured: [
      "Temperature",
      "Blood sugar",
      "Sleep hours",
      "Cabin CO₂ / hygiene checks",
    ],
    preventiveActions: [
      "Maintain ventilation and hygiene schedules",
      "Limit caffeine before sleep",
      "Log headaches or nausea in notes",
    ],
    relatedSystems: ["metabolic", "neuro_behavioral"],
    hrpRisks: [
      "Altered metabolic response",
      "Immune dysregulation in confined habitats",
      "Hypoxia / hypercapnia (elevated CO₂)",
    ],
    officialLinks: [
      { label: "NASA HRP — Spaceflight Hazards", url: HRP_HAZARDS_URL },
      { label: "CSA — Science on the ISS", url: CSA_ISS_SCIENCE_URL },
    ],
  },
];

export const EXAM_THRESHOLDS: ExamThreshold[] = [
  {
    metric: "systolicBP",
    label: "Systolic blood pressure",
    unit: "mmHg",
    normal: { min: 90, max: 130 },
    warning: { min: 80, max: 140 },
  },
  {
    metric: "diastolicBP",
    label: "Diastolic blood pressure",
    unit: "mmHg",
    normal: { min: 60, max: 85 },
    warning: { min: 50, max: 95 },
  },
  {
    metric: "heartRate",
    label: "Heart rate",
    unit: "bpm",
    normal: { min: 55, max: 90 },
    warning: { min: 45, max: 110 },
  },
  {
    metric: "bloodSugar",
    label: "Blood sugar",
    unit: "mg/dL",
    normal: { min: 70, max: 140 },
    warning: { min: 60, max: 180 },
  },
  {
    metric: "temperature",
    label: "Body temperature",
    unit: "°C",
    normal: { min: 36.1, max: 37.5 },
    warning: { min: 35.5, max: 38.0 },
  },
  {
    metric: "sleepHours",
    label: "Sleep",
    unit: "hours",
    normal: { min: 6, max: 9 },
    warning: { min: 4, max: 10 },
  },
  {
    metric: "moodScore",
    label: "Mood",
    unit: "1–5",
    normal: { min: 3, max: 5 },
    warning: { min: 2, max: 5 },
  },
  {
    metric: "stressLevel",
    label: "Stress level",
    unit: "1–10",
    normal: { min: 1, max: 5 },
    warning: { min: 1, max: 7 },
  },
  {
    metric: "radiationMsv",
    label: "Radiation dose",
    unit: "mSv",
    normal: { min: 0, max: 1.0 },
    warning: { min: 0, max: 1.5 },
  },
];

export const MEASUREMENT_GUIDE: Record<
  import("@/types/health").VitalsFormMetric,
  { howTo: string; whySpace: string }
> = {
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
      "Read today's dose from the personal dosimeter or cabin monitor. Enter cumulative daily exposure in mSv.",
    whySpace:
      "Deep-space and lunar missions lack Earth's magnetic shielding; dose tracking supports SPE shelter decisions.",
  },
  stressLevel: {
    howTo:
      "Rate perceived stress from 1 (calm) to 10 (overwhelming) using the crew wellness scale after your check-in.",
    whySpace:
      "Isolation, workload, and radiation awareness compound stress; early scores guide crew support before performance drops.",
  },
};

/** NASA/CSA caution line for daily radiation chart (mSv) */
export const RADIATION_CHART_CAUTION_MSV = 1.0;