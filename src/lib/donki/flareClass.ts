export interface ParsedFlareClass {
  letter: "C" | "M" | "X" | "unknown";
  magnitude: number;
}

export function parseFlareClass(classType: string): ParsedFlareClass {
  const trimmed = classType.trim().toUpperCase();
  const match = /^([CMXB])(\d+(?:\.\d+)?)/i.exec(trimmed);
  if (!match) {
    return { letter: "unknown", magnitude: 0 };
  }
  const letter = match[1].toUpperCase();
  const magnitude = Number.parseFloat(match[2]);
  if (letter === "C" || letter === "M" || letter === "X") {
    return { letter, magnitude: Number.isFinite(magnitude) ? magnitude : 0 };
  }
  return { letter: "unknown", magnitude: 0 };
}

/** Demo dose bump (mSv/day) from GOES flare class — not a clinical dosimeter model. */
export function flareClassToDailyDoseBumpMsv(classType: string): number {
  const { letter, magnitude } = parseFlareClass(classType);
  switch (letter) {
    case "X":
      return 1.1 + magnitude * 0.15;
    case "M":
      return 0.35 + magnitude * 0.08;
    case "C":
      return 0.08 + Math.min(magnitude, 9.9) * 0.02;
    default:
      return 0.05;
  }
}

export function flareClassToHourlyDoseBumpMsv(classType: string): number {
  return flareClassToDailyDoseBumpMsv(classType) / 8;
}