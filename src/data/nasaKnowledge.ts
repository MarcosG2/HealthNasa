import type { ExamThreshold, HazardKnowledgeBlock } from "@/types/health";

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
  },
  {
    hazard: "isolation",
    title: "Isolation & confinement",
    shortDescription:
      "Small crews far from home can affect sleep, mood, and team coordination.",
    whyMonitorInSpace:
      "Mood and sleep are early signs of stress. Catching trends early helps the crew support each other.",
    whatCanBeMeasured: [
      "Mood score (1–5)",
      "Sleep hours",
      "Heart rate at rest",
    ],
    preventiveActions: [
      "Keep a daily check-in routine",
      "Use scheduled communication with family or ground",
      "Balance workload and rest periods",
    ],
    relatedSystems: ["neuro_behavioral"],
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
  },
  {
    hazard: "closed_environment",
    title: "Closed environment",
    shortDescription:
      "Recycled air and water, noise, and CO₂ can affect sleep and metabolism.",
    whyMonitorInSpace:
      "Temperature, hydration, and blood sugar help detect dehydration or poor recovery in the cabin.",
    whatCanBeMeasured: [
      "Temperature",
      "Blood sugar",
      "Sleep hours",
    ],
    preventiveActions: [
      "Maintain ventilation and hygiene schedules",
      "Limit caffeine before sleep",
      "Log headaches or nausea in notes",
    ],
    relatedSystems: ["metabolic", "neuro_behavioral"],
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
];

export const MEASUREMENT_GUIDE: Record<
  ExamThreshold["metric"],
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
};