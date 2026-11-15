# Mission Health Control — visual system

**Mode:** Operate (mission console)  
**Thesis:** One continuous medical telemetry board on a void field—not a stack of equal cards.

## World

- **Ground:** Near-black void (`base-100`) with a fine 24px telemetry grid; no decorative radial washes.
- **Structure:** Hairline frames (`1px` `base-300`), panel fill barely above void (`base-100/50`).
- **Signal color:** Mission cyan (`primary`) for navigation, selection, and monospace readouts.
- **Depth:** Flat; no card-in-card, no heavy blur, no offset shadows. Status uses ring tint only.
- **Type:** Geist Sans for prose; Geist Mono for metrics (`mission-readout`). Section titles at one weight step; field labels sentence case (no tracked caps).

## Components (utilities)

| Utility | Role |
|--------|------|
| `mission-shell` | Page void + grid |
| `mission-command` | Top command bar |
| `mission-panel` | Framed sector |
| `mission-panel-head` | Sector title row |
| `mission-field-tab` | Inset label on telemetry cells |
| `mission-readout` | Tabular numeric telemetry |
| `mission-section-title` | Main column headings |
| `mission-telemetry-rail` | Three-up metric strip |
| `mission-strip` | Autonomy / context lines |

## Charts

Recharts uses `@/lib/chartTheme.ts` (`MISSION_CHART`): void grid, mono ticks, primary selection line. Chart area wrapped in `mission-chart-well`.

## Semaphore (unchanged contract)

`normal` → emerald · `warning` → amber · `critical` → rose via `@/lib/statusColors`.

## Motion

- **State:** Sector refresh glow (`sector-glow*`) on environment/crew/scenario updates only.
- **No** staggered page reveals; content is visible on load.

## References

Printed NASA medical log sheets and CRT telemetry—not generic slate SaaS dashboards.