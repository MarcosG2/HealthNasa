"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  BodyChart,
  ViewSide,
  type BodyState,
  type MuscleId,
} from "@emmorts/body-muscles";

interface BodyMuscleChartProps {
  bodyState: BodyState;
  ariaLabel: string;
  onMuscleActivate: (id: MuscleId) => void;
}

function resolveHealthIntensityColor(intensity: number): string {
  if (intensity >= 8) return "#fb7185";
  if (intensity >= 5) return "#fbbf24";
  if (intensity >= 1) return "#34d399";
  return "#334155";
}

export function BodyMuscleChart({
  bodyState,
  ariaLabel,
  onMuscleActivate,
}: BodyMuscleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const onActivateRef = useRef(onMuscleActivate);

  useEffect(() => {
    onActivateRef.current = onMuscleActivate;
  }, [onMuscleActivate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    chartRef.current = new BodyChart(el, {
      view: ViewSide.FRONT,
      bodyState,
      ariaLabel,
      showViewLabel: false,
      intensityColor: (value) => resolveHealthIntensityColor(value),
      className: "body-muscles-mission",
      onMuscleClick(id) {
        onActivateRef.current(id);
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; state via update()
  }, [ariaLabel]);

  useEffect(() => {
    chartRef.current?.update({ bodyState });
  }, [bodyState]);

  return (
    <div
      ref={containerRef}
      className="body-muscles-mission mx-auto w-full max-w-md [&_.body-muscles-mission]:min-h-[300px]"
      style={
        {
          "--bm-max-height": "340px",
          "--bm-region-stroke": "#475569",
          "--bm-region-stroke-selected": "#f8fafc",
          "--bm-region-inactive-opacity": "0.45",
          "--bm-tooltip-bg": "rgb(15 23 42 / 0.95)",
        } as CSSProperties
      }
    />
  );
}