import type { DonkiFlareRecord } from "@/types/health";

/** Fictional DONKI-style flares when NASA / CCMC are unreachable (demo ground API). */
export const MOCK_DONKI_FLARES: DonkiFlareRecord[] = [
  {
    flrID: "DEMO-MISSION-12-FLR-001",
    beginTime: "2026-03-12T14:00Z",
    peakTime: "2026-03-12T14:32Z",
    endTime: "2026-03-12T16:10Z",
    classType: "M2.3",
    sourceLocation: "N18W12",
    activeRegionNum: 15999,
    link: "",
    linkedEvents: [{ activityID: "DEMO-MISSION-12-CME-001" }],
  },
  {
    flrID: "DEMO-MISSION-11-FLR-001",
    beginTime: "2026-03-11T08:15Z",
    peakTime: "2026-03-11T08:41Z",
    endTime: "2026-03-11T09:05Z",
    classType: "C9.8",
    sourceLocation: "S05E40",
    activeRegionNum: 15998,
    link: "",
    linkedEvents: null,
  },
];