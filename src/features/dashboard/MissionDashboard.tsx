"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ASTRONAUT_ROSTER, archetypeLabel } from "@/data/astronautRoster";
import {
  AlertTriangle,
  Clock,
  Languages,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { buildMockMissionHistory, MOCK_MISSION_HISTORY } from "@/data/mockMissionHistory";
import { BodyMap } from "@/features/body-map/BodyMap";
import { evaluateHealth } from "@/features/rules-engine/evaluateHealth";
import { DayReplayDetail } from "@/features/timeline/DayReplayDetail";
import { HealthCharts } from "@/features/timeline/HealthCharts";
import {
  clinicalReadingForEvaluation,
  dailyReadingForMissionDay,
  isIntradaySample,
} from "@/lib/clinicalReading";
import { loadMissionLogs, LOG_KEY, saveMissionLogs } from "@/lib/missionLogsStorage";
import { formatMissionTimestamp } from "@/lib/missionTime";
import { MissionRoutinePanel } from "@/features/vitals-form/MissionRoutinePanel";
import { CognitiveWellnessPanel } from "@/features/vitals-form/CognitiveWellnessPanel";
import {
  ENVIRONMENT_LABELS,
  ENVIRONMENT_MISSION_META,
  HAZARD_DISPLAY,
  LOCALE_STORAGE_KEY,
  MISSION_PROFILE,
  statusLabelForLocale,
  type AppLocale,
  UI_STRINGS,
  escalationLabel,
} from "@/lib/locale";
import { statusStyles } from "@/lib/statusColors";
import { fetchAstronautRoster, fetchMissionFeed } from "@/lib/fetchMissionFeed";
import { fetchDonkiFlares } from "@/lib/fetchDonkiFlares";
import { applyDonkiFlaresToDailyHistory } from "@/lib/donki/applyFlaresToHistory";
import { SolarFlareAlertCard } from "@/features/dashboard/SolarFlareAlertCard";
import type { DonkiFlareFeedResponse } from "@/types/health";
import { fetchMissionTelemetryArchive } from "@/lib/telemetryArchive";
import type { MissionTelemetryArchive } from "@/types/health";
import { mergeActiveScenarios } from "@/lib/mergeMissionScenarios";
import type {
  CardioChartScale,
  ChartPanelId,
  RadiationChartScale,
  RecoveryChartScale,
  MissionEnvironment,
  MissionScenarioId,
  MockAstronautProfile,
  VitalReadings,
} from "@/types/health";

const SCENARIOS_KEY = "healthnasa_active_scenarios";
const ASTRONAUT_KEY = "healthnasa_astronaut_id";

const SCENARIO_LABEL: Record<
  AppLocale,
  Record<MissionScenarioId, string>
> = {
  es: {
    solar: "Partículas solares",
    cardio: "Cardio / deshidratación",
    isolation: "Aislamiento",
  },
  en: {
    solar: "Solar particles",
    cardio: "Cardio / dehydration",
    isolation: "Isolation",
  },
};

function loadLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "en" || raw === "es") return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

const ENVIRONMENT_IDS: MissionEnvironment[] = [
  "station",
  "spacecraft",
  "rover",
  "lunar_base",
  "mars_base",
];

function loadActiveScenarios(): MissionScenarioId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MissionScenarioId[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveActiveScenarios(scenarios: MissionScenarioId[]) {
  try {
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  } catch {
    /* ignore */
  }
}

function loadAstronautId(): string {
  if (typeof window === "undefined") return ASTRONAUT_ROSTER[0]?.id ?? "eva-chen";
  try {
    return localStorage.getItem(ASTRONAUT_KEY) ?? ASTRONAUT_ROSTER[0]?.id ?? "eva-chen";
  } catch {
    return ASTRONAUT_ROSTER[0]?.id ?? "eva-chen";
  }
}

function saveAstronautId(id: string) {
  try {
    localStorage.setItem(ASTRONAUT_KEY, id);
  } catch {
    /* ignore */
  }
}

function applyScenarioOverlay(
  baseline: VitalReadings[],
  activeScenarios: MissionScenarioId[],
  environment: MissionEnvironment
): VitalReadings[] {
  if (activeScenarios.length === 0 || baseline.length === 0) return baseline;
  const last = baseline[baseline.length - 1];
  const merged = mergeActiveScenarios(last, activeScenarios, environment);
  return [...baseline.slice(0, -1), merged];
}

export function MissionDashboard() {
  const [baselineHistory, setBaselineHistory] =
    useState<VitalReadings[]>(MOCK_MISSION_HISTORY);
  const [activeScenarios, setActiveScenarios] = useState<MissionScenarioId[]>([]);
  const [environment, setEnvironment] = useState<MissionEnvironment>("station");
  const [locale, setLocale] = useState<AppLocale>("en");
  const [mockFeedLabel, setMockFeedLabel] = useState<string | null>(null);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>("eva-chen");
  const [roster, setRoster] = useState<MockAstronautProfile[]>(ASTRONAUT_ROSTER);
  const [replayFocus, setReplayFocus] = useState<VitalReadings | null>(null);
  const [cardioScale, setCardioScale] = useState<CardioChartScale>("day");
  const [recoveryScale, setRecoveryScale] = useState<RecoveryChartScale>("day");
  const [radiationScale, setRadiationScale] = useState<RadiationChartScale>("day");
  const [cardioFocusDay, setCardioFocusDay] = useState<number | null>(null);
  const [recoveryFocusDay, setRecoveryFocusDay] = useState<number | null>(null);
  const [radiationFocusDay, setRadiationFocusDay] = useState<number | null>(null);
  const [chartFocusHour, setChartFocusHour] = useState<number | null>(null);
  const [telemetryArchive, setTelemetryArchive] =
    useState<MissionTelemetryArchive | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pulseOn, setPulseOn] = useState(false);
  const [updateNote, setUpdateNote] = useState("");
  const [donkiFeed, setDonkiFeed] = useState<DonkiFlareFeedResponse | null>(null);
  const baselineLoadSeq = useRef(0);
  const bodyTrackerAnchorRef = useRef<HTMLElement | null>(null);
  const simControlsLocked = replayFocus !== null;

  useEffect(() => {
    // Post-mount hydration: SSR uses MOCK_MISSION_HISTORY; client restores saved logs.
    const hydratedLogs = loadMissionLogs();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
    setBaselineHistory(hydratedLogs);
    if (
      hydratedLogs.length >= 28 &&
      hydratedLogs.some((r) => r.extraMetrics?.telemetrySource === "generator")
    ) {
      setArchiveLoaded(true);
    }
    setLocale(loadLocale());
    setActiveScenarios(loadActiveScenarios());
    const astronautId = loadAstronautId();
    setSelectedAstronautId(astronautId);

    let cancelled = false;
    void fetchAstronautRoster().then((list) => {
      if (!cancelled && list?.length) setRoster(list);
    });

    const hasSaved =
      typeof window !== "undefined" && Boolean(localStorage.getItem(LOG_KEY));
    if (!hasSaved) {
      void fetchMissionFeed("station", 14, astronautId).then((feed) => {
        if (cancelled || !feed?.telemetry?.length) return;
        setBaselineHistory(feed.telemetry);
        setEnvironment(feed.environment);
        saveMissionLogs(feed.telemetry);
        setMockFeedLabel(
          `${feed.crew.callSign} · ${feed.crew.agency} · ${feed.source}`
        );
      });
    }
    void fetchMissionTelemetryArchive().then((archive) => {
      if (cancelled || !archive) return;
      setTelemetryArchive(archive);
    });

    void fetchDonkiFlares(30).then((feed) => {
      if (!cancelled && feed) setDonkiFeed(feed);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const history = useMemo(
    () => applyScenarioOverlay(baselineHistory, activeScenarios, environment),
    [baselineHistory, activeScenarios, environment]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const ui = UI_STRINGS[locale];
  const profile = MISSION_PROFILE[locale];

  const latest =
    history[history.length - 1] ??
    MOCK_MISSION_HISTORY[MOCK_MISSION_HISTORY.length - 1];

  const dailyHistory = useMemo(
    () => history.filter((row) => !isIntradaySample(row)),
    [history]
  );

  const chartDailyHistory = useMemo(
    () => applyDonkiFlaresToDailyHistory(dailyHistory, donkiFeed?.flares),
    [dailyHistory, donkiFeed?.flares]
  );

  const focusReading = replayFocus ?? latest;
  const historyBeforeFocus = useMemo(() => {
    if (!replayFocus) return dailyHistory.slice(0, -1);
    return dailyHistory.filter((row) => row.missionDay < replayFocus.missionDay);
  }, [dailyHistory, replayFocus]);

  const clinicalFocus = useMemo(
    () => clinicalReadingForEvaluation(focusReading, dailyHistory),
    [focusReading, dailyHistory]
  );

  const evaluation = useMemo(
    () => evaluateHealth(clinicalFocus, historyBeforeFocus, locale),
    [clinicalFocus, historyBeforeFocus, locale]
  );

  const timelineFocusHour =
    cardioScale === "5sec"
      ? (chartFocusHour ?? new Date(latest.recordedAt).getUTCHours())
      : chartFocusHour;

  const envMeta = ENVIRONMENT_MISSION_META[locale][focusReading.environment];

  const overallStyles = statusStyles(evaluation.overallStatus);
  const selectedAstronaut =
    roster.find((a) => a.id === selectedAstronautId) ?? roster[0];

  async function restoreBaselineFromFeed(
    astronautId = selectedAstronautId,
    env: MissionEnvironment = environment
  ): Promise<boolean> {
    const seq = ++baselineLoadSeq.current;
    const feed = await fetchMissionFeed(env, 14, astronautId);
    if (seq !== baselineLoadSeq.current) return false;

    if (feed?.telemetry?.length) {
      const telemetry = feed.telemetry.map((row) => ({ ...row, environment: env }));
      setBaselineHistory(telemetry);
      setEnvironment(env);
      saveMissionLogs(telemetry);
      setMockFeedLabel(
        `${feed.crew.callSign} · ${feed.crew.agency} · ${feed.source}`
      );
      return true;
    }
    const baseline = buildMockMissionHistory(env);
    setBaselineHistory(baseline);
    setEnvironment(env);
    saveMissionLogs(baseline);
    return true;
  }

  type RefreshReason = "environment" | "crew" | "scenario" | "baseline";

  function signalRefresh(reason: RefreshReason) {
    const note =
      reason === "environment"
        ? ui.sectorsUpdatedEnvironment
        : reason === "crew"
          ? ui.sectorsUpdatedCrew
          : reason === "scenario"
            ? ui.sectorsUpdatedScenario
            : ui.sectorsUpdatedBaseline;
    setUpdateNote(note);
    setPulseOn(false);
    setRefreshToken((n) => n + 1);
    requestAnimationFrame(() => setPulseOn(true));
  }

  function resetChartScales() {
    setCardioScale("day");
    setRecoveryScale("day");
    setRadiationScale("day");
    setCardioFocusDay(null);
    setRecoveryFocusDay(null);
    setRadiationFocusDay(null);
    setChartFocusHour(null);
  }

  const missionDayOptions = useMemo(
    () => dailyHistory.map((r) => r.missionDay).sort((a, b) => a - b),
    [dailyHistory]
  );

  function onCardioScaleChange(next: CardioChartScale) {
    setCardioScale(next);
    if (next !== "day" && cardioFocusDay === null) {
      setCardioFocusDay(latest.missionDay);
    }
  }

  function onRecoveryScaleChange(next: RecoveryChartScale) {
    setRecoveryScale(next);
    if (next === "hour" && recoveryFocusDay === null) {
      setRecoveryFocusDay(latest.missionDay);
    }
  }

  function onRadiationScaleChange(next: RadiationChartScale) {
    setRadiationScale(next);
    if (next === "hour" && radiationFocusDay === null) {
      setRadiationFocusDay(latest.missionDay);
    }
  }

  async function resetBaseline() {
    if (simControlsLocked) return;
    setActiveScenarios([]);
    saveActiveScenarios([]);
    setReplayFocus(null);
    resetChartScales();
    setArchiveLoaded(false);
    const ok = await restoreBaselineFromFeed();
    if (ok) signalRefresh("baseline");
  }

  function toggleScenario(scenarioId: MissionScenarioId) {
    if (simControlsLocked) return;
    setActiveScenarios((prev) => {
      const next = prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId];
      saveActiveScenarios(next);
      return next;
    });
    signalRefresh("scenario");
  }

  async function onSelectAstronaut(astronautId: string) {
    if (simControlsLocked) return;
    setSelectedAstronautId(astronautId);
    saveAstronautId(astronautId);
    setActiveScenarios([]);
    saveActiveScenarios([]);
    setReplayFocus(null);
    resetChartScales();
    setArchiveLoaded(false);
    const ok = await restoreBaselineFromFeed(astronautId);
    if (ok) signalRefresh("crew");
  }

  function toggleLocale() {
    setLocale((l) => (l === "es" ? "en" : "es"));
  }

  async function onSelectEnvironment(env: MissionEnvironment) {
    if (simControlsLocked || env === environment) return;
    setEnvironment(env);
    setReplayFocus(null);
    resetChartScales();
    setArchiveLoaded(false);
    const ok = await restoreBaselineFromFeed(selectedAstronautId, env);
    if (ok) signalRefresh("environment");
  }

  function returnToLiveNow() {
    setReplayFocus(null);
    resetChartScales();
  }

  function onChartPointSelect(reading: VitalReadings, panel: ChartPanelId) {
    const hourUtc = new Date(reading.recordedAt).getUTCHours();
    const daily =
      dailyReadingForMissionDay(dailyHistory, reading.missionDay) ?? reading;

    if (panel === "cardio") {
      if (cardioScale === "day") {
        setCardioFocusDay(daily.missionDay);
        setCardioScale("minute");
        setChartFocusHour(null);
        setReplayFocus(daily);
      } else if (cardioScale === "minute") {
        setCardioFocusDay(daily.missionDay);
        setChartFocusHour(hourUtc);
        setCardioScale("5sec");
        setReplayFocus(reading);
      } else {
        setReplayFocus(reading);
      }
    } else if (panel === "recovery") {
      if (recoveryScale === "day") {
        setRecoveryFocusDay(daily.missionDay);
        setRecoveryScale("hour");
        setReplayFocus(daily);
      } else {
        setReplayFocus(reading);
      }
    } else if (radiationScale === "day") {
      setRadiationFocusDay(daily.missionDay);
      setRadiationScale("hour");
      setReplayFocus(daily);
    } else {
      setReplayFocus(reading);
    }

    requestAnimationFrame(() => {
      bodyTrackerAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function onReactionRecorded(ms: number) {
    setBaselineHistory((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      const updated: VitalReadings = {
        ...last,
        extraMetrics: {
          ...last.extraMetrics,
          reactionTimeMs: ms,
        },
      };
      const next = [...prev.slice(0, -1), updated];
      saveMissionLogs(next);
      return next;
    });
  }

  async function load30DayArchive() {
    if (simControlsLocked || archiveLoading || archiveLoaded) return;
    setArchiveLoading(true);
    try {
      const archive =
        telemetryArchive ?? (await fetchMissionTelemetryArchive());
      if (!archive?.daily.length) {
        window.alert(ui.load30DayArchiveMissing);
        return;
      }
      setTelemetryArchive(archive);
      setActiveScenarios([]);
      saveActiveScenarios([]);
      setReplayFocus(null);
      resetChartScales();
      setBaselineHistory(archive.daily);
      setEnvironment(archive.meta.environment);
      saveMissionLogs(archive.daily);
      setArchiveLoaded(true);
      setMockFeedLabel(
        `${archive.meta.missionDays}d layered telemetry · hot ${archive.meta.hotWindowHours}h`
      );
      signalRefresh("baseline");
    } finally {
      setArchiveLoading(false);
    }
  }

  const envLabel = ENVIRONMENT_LABELS[locale][focusReading.environment];

  return (
    <div className={`mission-shell${pulseOn ? " mission-refresh" : ""}`}>
      <a href="#main-content" className="skip-link">
        {ui.skipToMain}
      </a>
      <p className="sr-only" role="status" aria-live="polite">
        {updateNote}
      </p>

      <header className="mission-command">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/50 bg-base-100">
                <Rocket className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{ui.appTitle}</h1>
                <p className="mt-0.5 max-w-prose text-sm text-base-content/75">{ui.appSubtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleLocale}
              className="btn btn-sm btn-ghost shrink-0 gap-2 self-start border border-base-300/60"
              aria-label={
                locale === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish"
              }
            >
              <Languages className="h-4 w-4" aria-hidden />
              {ui.switchToEnglish}
            </button>
          </div>

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={ui.crewStatusLive}
            className={`mission-panel flex gap-3 p-3 ring-1 ${overallStyles.ring} ${overallStyles.bg}`}
          >
            <Radio className={`mt-0.5 h-5 w-5 shrink-0 ${overallStyles.text}`} aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-base-content">
                {evaluation.headline}
              </p>
              <p className={`mt-1 text-xs font-semibold ${overallStyles.text}`}>
                {statusLabelForLocale(locale, evaluation.overallStatus)}
              </p>
            </div>
            <p className="mission-readout ml-auto hidden self-center text-right text-xs sm:block">
              {replayFocus ? `${ui.crewStatusReview} — ` : ""}
              {ui.missionDay} {focusReading.missionDay}
            </p>
          </div>

          <dl
            aria-label={ui.artemisProfile}
            className="mission-sector mission-telemetry-rail rounded-box"
          >
            <TelemetryField icon={Users} label={ui.artemisProfile}>
              <p className="font-medium text-base-content">
                {selectedAstronaut?.fullName ?? profile.missionName}
              </p>
              <p className="text-base-content/80">
                {selectedAstronaut?.callSign ?? profile.commanderRole} ·{" "}
                {selectedAstronaut?.role ?? profile.medicalOfficerRole}
              </p>
              <p className="text-xs text-base-content/70">
                {replayFocus
                  ? `${statusLabelForLocale(locale, evaluation.overallStatus)} · ${evaluation.headline}`
                  : selectedAstronaut
                    ? archetypeLabel(selectedAstronaut.archetype, locale)
                    : profile.program}
              </p>
              <p className="mission-readout text-primary/90">{envLabel}</p>
            </TelemetryField>
            <TelemetryField icon={Clock} label={ui.communicationLatency}>
              <p className="mission-readout text-lg text-primary">{envMeta.latencyLabel}</p>
            </TelemetryField>
            <TelemetryField icon={Shield} label={ui.activeEnvironmentRisks}>
              <p className="leading-snug">
                {envMeta.primaryHazards
                  .map((h) => HAZARD_DISPLAY[locale][h].title)
                  .join(" · ")}
              </p>
            </TelemetryField>
          </dl>

          <div className="grid gap-3 lg:grid-cols-2">
            <p className="mission-sector mission-strip rounded-field">
              <span className="font-medium text-base-content">{ui.whyAutonomous}. </span>
              {envMeta.autonomyNote}
            </p>
            <div className="mission-sector mission-strip rounded-field">
              <p className="font-medium text-base-content">{ui.environmentBrief}</p>
              <p className="mt-1">
                <span className="text-base-content/70">{ui.habitatLabel}: </span>
                {envMeta.habitatName}
              </p>
              <p className="mt-1">
                <span className="text-base-content/70">{ui.healthFocusLabel}: </span>
                {envMeta.healthFocus}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl space-y-0 px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mb-6">
          <SolarFlareAlertCard feed={donkiFeed} locale={locale} />
        </div>
        {replayFocus ? (
          <section
            ref={bodyTrackerAnchorRef}
            aria-labelledby="body-replay-heading"
            className="mission-panel sticky top-2 z-20 scroll-mt-4 border border-primary/45 bg-base-100/95 p-4"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="body-replay-heading" className="mission-section-title text-base">
                  {ui.bodyReplayAtTop}
                </h2>
                <p className="mt-1 text-sm text-base-content/80">
                  {ui.missionDay} {replayFocus.missionDay} ·{" "}
                  <span className="mission-readout text-primary">
                    {formatMissionTimestamp(replayFocus.recordedAt, locale)} UTC
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <p
                  className={`rounded-field border border-base-300/60 px-3 py-2 text-xs font-semibold ${overallStyles.bg} ${overallStyles.text}`}
                  role="status"
                >
                  {statusLabelForLocale(locale, evaluation.overallStatus)}
                </p>
                <button
                  type="button"
                  onClick={returnToLiveNow}
                  className="btn btn-sm btn-primary gap-2"
                >
                  <Clock className="h-4 w-4" aria-hidden />
                  {ui.returnToNow}
                </button>
              </div>
            </div>
            <BodyMap
              systemStatuses={evaluation.systemStatuses}
              locale={locale}
              refreshToken={refreshToken}
            />
          </section>
        ) : null}

        <section aria-labelledby="sim-controls-heading" className="mission-zone">
          <h2 id="sim-controls-heading" className="sr-only">
            {ui.simulationControls}
          </h2>
          <div
            className={`mission-panel p-4 ${simControlsLocked ? "opacity-75" : ""}`}
            aria-disabled={simControlsLocked}
          >
            {simControlsLocked ? (
              <p
                role="status"
                className="mb-4 rounded-field border border-primary/35 bg-primary/10 px-3 py-2 text-sm text-base-content/85"
              >
                {ui.replayModeBanner}{" "}
                <span className="mission-readout text-xs text-primary">
                  {formatMissionTimestamp(replayFocus!.recordedAt, locale)} UTC
                </span>
              </p>
            ) : null}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="mission-section-title">{ui.simulationControls}</p>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <p className="mission-readout text-base-content/80 lg:text-right">
                  {ui.missionDay} {focusReading.missionDay} · {envLabel}
                </p>
                {simControlsLocked ? (
                  <button
                    type="button"
                    onClick={returnToLiveNow}
                    className="btn btn-sm btn-primary gap-2"
                  >
                    <Clock className="h-4 w-4" aria-hidden />
                    {ui.returnToNow}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-base-content/65">{ui.scenarioTapToDeactivate}</p>
            <p className="mt-2 text-xs text-base-content/70">
              <span className="font-medium text-base-content">{ui.activeScenariosLabel}: </span>
              {activeScenarios.length > 0
                ? activeScenarios.map((id) => SCENARIO_LABEL[locale][id]).join(" · ")
                : ui.noActiveScenarios}
            </p>
            <p className="mt-1 text-xs text-base-content/65">{envMeta.scenarioContext}</p>

            <fieldset
              disabled={simControlsLocked}
              className="mt-4 space-y-4 rounded-field border-0 p-0 disabled:pointer-events-none disabled:opacity-60"
            >
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="mission-sector block max-w-xl rounded-field">
                <span className="text-xs font-medium text-base-content/70">
                  {ui.crewRoster}
                </span>
                <select
                  className="select select-bordered select-sm mt-1 w-full"
                  value={selectedAstronautId}
                  onChange={(e) => void onSelectAstronaut(e.target.value)}
                  aria-label={ui.selectAstronaut}
                  disabled={simControlsLocked}
                >
                  {roster.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.callSign} — {member.fullName} (
                      {archetypeLabel(member.archetype, locale)}) ·{" "}
                      {ENVIRONMENT_LABELS[locale][member.homeEnvironment]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mission-sector rounded-field">
                <span className="text-xs font-medium text-base-content/70">
                  {ui.missionEnvironment}
                </span>
                <div
                  className="mission-horiz-scroll mt-1 flex-wrap sm:flex"
                  role="tablist"
                  aria-label={ui.missionEnvironment}
                >
                  {ENVIRONMENT_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={environment === id}
                      onClick={() => void onSelectEnvironment(id)}
                      disabled={simControlsLocked}
                      className={`btn btn-xs sm:btn-sm ${
                        environment === id ? "btn-primary" : "btn-outline"
                      }`}
                    >
                      {ENVIRONMENT_LABELS[locale][id]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={ui.simulationControls}
            >
              <ScenarioButton
                icon={Sun}
                label={ui.simulateSolarEvent}
                active={activeScenarios.includes("solar")}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={() => toggleScenario("solar")}
                tone="amber"
                disabled={simControlsLocked}
              />
              <ScenarioButton
                icon={AlertTriangle}
                label={ui.simulateCardioDehydration}
                active={activeScenarios.includes("cardio")}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={() => toggleScenario("cardio")}
                tone="rose"
                disabled={simControlsLocked}
              />
              <ScenarioButton
                icon={Radio}
                label={ui.simulateIsolationDrift}
                active={activeScenarios.includes("isolation")}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={() => toggleScenario("isolation")}
                tone="violet"
                disabled={simControlsLocked}
              />
              <ScenarioButton
                icon={RotateCcw}
                label={ui.resetBaseline}
                active={activeScenarios.length === 0}
                activeLabel={ui.scenarioActive}
                inactiveLabel={ui.scenarioInactive}
                onClick={resetBaseline}
                tone="neutral"
                disabled={simControlsLocked}
              />
            </div>
            </fieldset>

            {mockFeedLabel ? (
              <p className="mt-2 text-xs text-base-content/70">
                <span className="font-medium text-emerald-400">{ui.mockGroundFeedConnected}</span>
                {" · "}
                {ui.mockGroundFeed}
                {" — "}
                <span className="mission-readout">{mockFeedLabel}</span>
              </p>
            ) : null}
          </div>
        </section>

        <div className="mission-zone grid min-w-0 gap-6 xl:grid-cols-12 xl:gap-8">
          <section
            className="min-w-0 space-y-6 xl:col-span-8 xl:space-y-8"
            aria-labelledby="body-systems-heading"
          >
            {!replayFocus ? (
              <MotionReveal>
                <section ref={bodyTrackerAnchorRef} id="body-systems-section">
                  <h2 id="body-systems-heading" className="mission-section-title mb-4">
                    {ui.bodyMapTitle}
                  </h2>
                  <BodyMap
                    systemStatuses={evaluation.systemStatuses}
                    locale={locale}
                    refreshToken={refreshToken}
                  />
                </section>
              </MotionReveal>
            ) : null}

            <MotionReveal>
              <h2 className="mission-section-title mb-4">{ui.missionTimeline}</h2>
              <HealthCharts
                history={chartDailyHistory}
                locale={locale}
                donkiFlares={donkiFeed?.flares}
                cardioScale={cardioScale}
                recoveryScale={recoveryScale}
                radiationScale={radiationScale}
                onCardioScaleChange={onCardioScaleChange}
                onRecoveryScaleChange={onRecoveryScaleChange}
                onRadiationScaleChange={onRadiationScaleChange}
                cardioFocusDay={cardioFocusDay}
                recoveryFocusDay={recoveryFocusDay}
                radiationFocusDay={radiationFocusDay}
                onCardioFocusDayChange={setCardioFocusDay}
                onRecoveryFocusDayChange={setRecoveryFocusDay}
                onRadiationFocusDayChange={setRadiationFocusDay}
                missionDayOptions={missionDayOptions}
                focusHourUtc={timelineFocusHour}
                latestMissionDay={
                  telemetryArchive?.daily[telemetryArchive.daily.length - 1]?.missionDay ??
                  latest.missionDay
                }
                selectedRecordedAt={replayFocus?.recordedAt ?? null}
                onSelectPoint={onChartPointSelect}
                onLoadArchive={load30DayArchive}
                archiveLoading={archiveLoading}
                archiveLoaded={archiveLoaded}
                loadArchiveDisabled={simControlsLocked}
                animateLines={!simControlsLocked}
                telemetryArchive={telemetryArchive}
              />
              {replayFocus ? (
                <DayReplayDetail
                  reading={replayFocus}
                  priorHistory={historyBeforeFocus}
                  dailyHistory={dailyHistory}
                  locale={locale}
                  onReturnToNow={returnToLiveNow}
                />
              ) : null}
            </MotionReveal>
          </section>

          <aside className="min-w-0 space-y-6 xl:col-span-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-2rem)] xl:self-start xl:overflow-y-auto">
            <MotionReveal>
              <h2 className="mission-section-title mb-4">{ui.recommendedActions}</h2>
              <ul className="space-y-3">
                {evaluation.guidance.map((g, i) => (
                  <li key={i} className="mission-panel p-4 text-sm text-base-content/85">
                    <p className="font-medium text-base-content">{g.whyNeededInSpace}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {g.recommendedActions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-base-content/75">
                {ui.escalation}:{" "}
                <span className="mission-readout text-primary">
                  {escalationLabel(locale, evaluation.escalationLevel)}
                </span>
              </p>
            </MotionReveal>

          </aside>
        </div>

        <section
          className="mission-zone mt-8 scroll-mt-6"
          aria-labelledby="crew-wellness-heading"
        >
          <h2 id="crew-wellness-heading" className="mission-section-title mb-6">
            {locale === "es"
              ? "Bienestar cognitivo y contramedidas diarias"
              : "Cognitive wellness & daily countermeasures"}
          </h2>
          <div className="grid min-w-0 gap-8 xl:grid-cols-12 xl:gap-10">
            <div className="min-w-0 xl:col-span-7">
              <h3 className="mission-section-title mb-4 text-base sm:text-lg">
                {locale === "es"
                  ? "Bienestar cognitivo y mental"
                  : "Cognitive & mental wellness"}
              </h3>
              <CognitiveWellnessPanel
                locale={locale}
                astronautId={selectedAstronautId}
                missionDay={focusReading.missionDay}
              />
            </div>
            <div className="min-w-0 xl:col-span-5">
              <h3 className="mission-section-title mb-4 text-base sm:text-lg">
                {ui.dailyCountermeasures}
              </h3>
              <MissionRoutinePanel
                locale={locale}
                onReactionRecorded={onReactionRecorded}
              />
              <p className="mt-4 text-sm leading-relaxed text-base-content/75">
                {profile.program}
              </p>
              <p className="mt-2 text-sm text-base-content/65">
                {locale === "es"
                  ? "La sincronización con Tierra es opcional; la evaluación clínica se ejecuta en el navegador."
                  : "Ground sync is optional; clinical evaluation runs entirely in the browser."}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-300/80 bg-base-100/90">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-base-content">{ui.officialReferences}</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {OFFICIAL_FOOTER_LINKS.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}

const OFFICIAL_FOOTER_LINKS = [
  {
    label: "NASA HRP — Spaceflight Hazards",
    url: "https://www.nasa.gov/hrp/hazards/",
  },
  {
    label: "NASA HRP — Human Health Risks",
    url: "https://www.nasa.gov/hrp/risks/",
  },
  {
    label: "NASA HRP — Ongoing Research",
    url: "https://www.nasa.gov/hrp/ongoing-hrp-research/",
  },
  {
    label: "CSA — Monitoring radiation & astronaut health",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
  },
  {
    label: "CSA — Science on the ISS",
    url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
  },
] as const;

function TelemetryField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mission-telemetry-cell">
      <dt className="mission-field-tab">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        {label}
      </dt>
      <dd className="space-y-0.5 text-sm text-base-content/90">{children}</dd>
    </div>
  );
}

type ScenarioTone = "amber" | "rose" | "violet" | "neutral";

const SCENARIO_TONE_CLASS: Record<ScenarioTone, { idle: string; active: string }> = {
  amber: {
    idle:
      "border-amber-500/35 bg-amber-500/5 text-amber-100/90 hover:border-amber-400/55 hover:bg-amber-500/15",
    active:
      "border-amber-400 bg-amber-500/25 text-amber-50 ring-2 ring-amber-400/70 ring-offset-2 ring-offset-base-200",
  },
  rose: {
    idle:
      "border-rose-500/35 bg-rose-500/5 text-rose-100/90 hover:border-rose-400/55 hover:bg-rose-500/15",
    active:
      "border-rose-400 bg-rose-500/25 text-rose-50 ring-2 ring-rose-400/70 ring-offset-2 ring-offset-base-200",
  },
  violet: {
    idle:
      "border-violet-500/35 bg-violet-500/5 text-violet-100/90 hover:border-violet-400/55 hover:bg-violet-500/15",
    active:
      "border-violet-400 bg-violet-500/25 text-violet-50 ring-2 ring-violet-400/70 ring-offset-2 ring-offset-base-200",
  },
  neutral: {
    idle:
      "border-base-300 bg-base-100/40 text-base-content hover:border-base-content/30 hover:bg-base-200/80",
    active:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-100 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-base-200",
  },
};

function ScenarioButton({
  icon: Icon,
  label,
  onClick,
  tone,
  active,
  activeLabel,
  inactiveLabel,
  disabled = false,
}: {
  icon: typeof Sun;
  label: string;
  onClick: () => void;
  tone: ScenarioTone;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  disabled?: boolean;
}) {
  const isOn = active;
  const toneClasses = SCENARIO_TONE_CLASS[tone];
  const stateLabel = isOn ? activeLabel : inactiveLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isOn}
      disabled={disabled}
      className={`btn btn-sm h-auto min-h-0 gap-2.5 border px-3.5 py-2.5 font-normal ${
        isOn ? toneClasses.active : toneClasses.idle
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 self-center" aria-hidden />
      <span className="text-left">
        <span className="block leading-snug">{label}</span>
        <span
          className={`mt-1 block text-[10px] font-medium ${
            isOn ? "text-current" : "text-base-content/50"
          }`}
        >
          <span
            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${
              isOn ? "bg-current animate-pulse" : "bg-base-content/30"
            }`}
            aria-hidden
          />
          {stateLabel}
        </span>
      </span>
    </button>
  );
}

function MotionReveal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}