# Plan: adopting `@deltares/fews-web-oc-charts` v5 in FEWS Web OC

Status date: 2026-10-25 (updated 21:46). Based on `fews-web-oc-charts@next` **`7018de8`**
(production live-stream acceptance; **Phase 4 complete**) and `PLAN-v5.md`; the locally
installed build `deltares-fews-web-oc-charts-4.7.2.tgz` (rebuilt 20:54) matches that commit and exposes
**both** the v4 classes (`CartesianAxes`, `ChartLine`, visitors, …) and the v5 functional
API (`createPlot`, `series`, `timeScale`, `zoom`, `legend`, `subscribe`, `sharedPointer`,
…) from the package root. The package still has a single root export (no `./vue`,
`./compat` subpaths).

### Changes since the first review (`f6da66b` → `9b619f7`, 29 commits)

| Area | New in the library | Effect on this plan |
| --- | --- | --- |
| Reactivity | `subscribe(signal, fn, { immediate, signal, equals })`, `effect()`; `plot.on('domainchange' \| 'layoutchange' \| 'legendchange')` + typed DOM events with `source`/`explicit`; README "Listening to changes" | Rec. A1 **done** → unblocks W2/W3 |
| Markers | `MarkerSymbol`: circle, cross, square, diamond, star, wye, triangle(-up/-down/-left/-right), x, plus, rectangle | Rec. A2 **done**; all FEWS `markerStyle`s map |
| Tooltip | `formatValue`, `formatUnit`, `formatRange` hooks with `TooltipFormatContext` | Rec. A3 **done** |
| Sync | `sharedPointer` (+ `crosshair({ pointer })`), `sharedSelection` (+ `brush({ selection, persistent: true })`), `sharedClock` | Rec. B12 **done**; brush ↔ subplots without glue |
| Live | `timeScale({ follow: { window, lead } })`, `scale.following` signal; zoom/pan suspend, reset resumes | Phase 4 follow step implemented |
| Phase 3 | Interaction parity suites/examples (`v5-parity-zoom`, `-brush`, `-mouseover`), pan/zoom reset policies | Phase 3 closed |

### Changes since the second review (`9b619f7` → `7018de8`, 14 commits)

| Area | New in the library | Effect on this plan |
| --- | --- | --- |
| Incremental series | `SeriesChange` with operation, invalidated index range, replaced/evicted rows; 128-sample block extent index (full and viewport-windowed extents); unretained line-only appends extend the existing SVG path; dense line-only series use a bounded viewport LOD cache (M4, preserves extrema/gaps, 16 entries/2 MiB) built on reused block summaries; `SeriesLod` type exported | Phase 4 step 4 done for series → W5 unblocked |
| Incremental tables/stacks | `TableChange` (kind, ranges, `spliceFrom`, key bounds); aligned circular buffers without survivor relocation; stack layouts share immutable 128-row blocks across append/prepend/upsert; candidate validation reads only inserted rows; fixed closure-chain memory leak in stacks | Phase 4 step 4 done for tables/stacks |
| Visibility | `plot.pause()`, `plot.resume()`, `plot.paused`; shared IntersectionObserver (one per page); plugins skip visual work while suspended; one catch-up frame on resume | Phase 4 step 5 done → rec. 9 ✅ |
| Live acceptance | `examples/v5-live-stream` (public API only), `npm run test:live:stream`, `npm run test:live:memory` (1M-point line, composite stack fixture; plateau ≤ 1 MiB) | Phase 4 step 6 done; **Phase 4 closed** |
| Examples | `v5-zoom` uses `plot.on('domainchange')`; `v5-brush` and `v5-parity-brush` use `subscribe(scale.domain)` | Subscription follow-up done |
| Layout | `renderLayout()` keeps previous `size`/`regions` when geometry is identical → no duplicate overlay renders, fewer `layoutchange` no-ops | Fewer spurious Vue updates for the `#brush` margin bridge |

## 1. Goals and constraints

- Keep the current v4 components (`TimeSeriesChart.vue`, `TimeSeriesChartBrush.vue`, …)
  working unchanged.
- Add parallel v5 components with the **same props / emits / exposed contract**, so the
  parent components only choose an implementation.
- Switch v4 ↔ v5 at runtime per user (setting + URL override), default `v4`.
- Use v5 to delete web-oc workarounds rather than port them.
- Avoid coupling to v5 internals so the code can later move to the official
  `@deltares/fews-web-oc-charts/vue` adapter (v5 phase 8) with little churn.

## 2. Current v4 integration (inventory)

| Area | Files | v4 API used |
| --- | --- | --- |
| Main chart | `components/charts/TimeSeriesChart.vue` | `CartesianAxes`, `MouseOver`, `ZoomHandler`, `PanHandler`, `CurrentTime`, `AlertLines`, `CrossSectionSelect`, `toggleChartVisibility`, margin `Proxy` |
| Brush | `components/charts/TimeSeriesChartBrush.vue` | `CartesianAxes`, `BrushHandler` |
| Chart building | `lib/charts/timeSeriesChart.ts` | `ChartLine/Marker/Area/Rule/Bar/Matrix`, `addTo`, `removeChart`, `redraw({autoScale…})` |
| Data updates | `services/useSeriesUpdateChartData` | signature diffing → `chart.data = …` + `redraw` |
| Config mapping | `lib/charts/timeSeriesDisplayToChartConfig.ts`, `axisOptions.ts`, `styles.ts`, `types/*` | `AxisOptions`, `AxisType`, `AxisPosition`, `SymbolOptions`, CSS style objects, lodash `merge` |
| Legend | `lib/charts/tags.ts`, `ChartLegend.vue`, `ChartLegendOverlay.vue` | `chart.drawLegendSymbol()` + `XMLSerializer` → `v-html` chips |
| Shared interaction | `services/useChartHandlers` | shared `ZoomHandler`(x / y) and `PanHandler` |
| Consumers | `TimeSeriesComponent.vue`, `AnalysisPlotChart.vue`, `AnalysisFilterChart.vue`, `SsdTimeSeriesDisplay.vue` | props `zoomHandler`, `panHandler`, expose `getSvgElement`, `axisAccept(Legend)` for PNG export |
| Other | `stores/userSettings.ts` (`WheelMode`), `lib/legend` (`ColourMap`), `wms/ColourBar.vue`, `wms/ColourStrip.vue` | colour-bar Axes |

## 3. Architecture for side-by-side v4/v5

### 3.1 Engine switch

- New user setting `charts.engine` (`'v4' | 'v5'`, default `'v4'`) in
  `src/assets/DefaultUserSettings.json` (group *Charts*), exposed as
  `userSettingsStore.chartEngine`. Existing `get(id)` already honours a URL override →
  `?charts.engine=v5` for testers/CI without touching settings.
- Optional deployment default via web-oc config / `VITE_CHARTS_ENGINE`, so an operator can
  pilot v5 for a whole installation.
- Parents pick the implementation via an engine-neutral wrapper:

  ```
  components/charts/
    TimeSeriesChart.vue          ← v4 (unchanged)
    TimeSeriesChartBrush.vue     ← v4 (unchanged)
    TimeSeriesChartSwitch.vue    ← new: <component :is="engine === 'v5' ? V5 : V4" v-bind="$attrs">
    v5/
      TimeSeriesChartV5.vue
      TimeSeriesChartBrushV5.vue
      ChartLegendV5.vue          (or reuse ChartLegend via engine-neutral tags)
  ```

  Use `defineAsyncComponent` for the v5 tree so v4 users do not load it. Changing the
  setting remounts the subplot list (`:key="engine"` on the `KeepAlive` block) – no
  mixed v4/v5 subplots in one display.

### 3.2 Engine-neutral contract

Define the common surface once (`lib/charts/types/TimeSeriesChartProps.ts`):

- props: `config: ChartConfig`, `series`, `highlightTime?`, `verticalProfile?`,
  `forecastLegend?`, `settings`, `maximized?`, plus **`group?: ChartGroup`** replacing
  `zoomHandler` / `panHandler`.
- `v-model:domain`, emit `toggle-maximize`, slot `#brush="{ margin }"`.
- expose: `getSvgElement()` and **`exportImage({ legend })`** (replaces `axisAccept(Legend)`,
  which leaks a v4 visitor into `AnalysisPlotChart`).

`ChartGroup` (from a reworked `useChartHandlers`, provide/inject as today):

| | v4 implementation | v5 implementation |
| --- | --- | --- |
| shared x zoom | `ZoomHandler({ sharedZoomMode: X })` | one shared `timeScale({ timeZone, locale })` handle used by all subplots + per-plot `zoom({ mode: 'x' })` |
| shared pan | `PanHandler` | per-plot `pan({ mode: 'x', modifier: Shift })` on the shared scale |
| vertical profile y zoom | `ZoomHandler({ sharedZoomMode: Y })` | shared `linearScale` for the y (elevation) axis |
| wheel mode | `WheelMode` enum | `ZoomWheelMode` string (`'x' \| 'y' \| 'xy' \| 'none'`) |
| hover across subplots | – (not synchronised) | one `sharedPointer({ by: 'x' })` passed to every `crosshair({ pointer })` |
| brush ↔ main charts | `BrushHandler` + `update:x-brush-domain` + watchers | shared main time scale; full-domain overview scale + `sharedSelection()` for the brush selection |
| current time | `CurrentTime` visitor per chart | one `sharedClock({ interval })` (rendering still Phase 6, interim `rule`) |

`userSettingsStore.scrollZoomMode` should return an engine-neutral string
(`'x' | 'y' | 'xy' | 'none'`); each engine maps it.

### 3.3 Decouple `ChartConfig` from v4 types (first refactor, no behaviour change)

`ChartConfig`, `ChartSeries`, `timeSeriesDisplayToChartConfig.ts` and `styles.ts` import
`AxisOptions`, `AxisType`, `AxisPosition`, `SymbolOptions` from the library. Replace with
web-oc-owned types (`ChartAxis { kind: 'time'|'value'|'degrees'|'band', position: 'left'|'right'|'bottom'|'top', label, domain?, defaultDomain?, includeZero, reverse, nice }`,
`ChartMarker { shape, size }`, `ChartStyle { stroke, strokeWidth, dash, fill, opacity }`).
Then:

```
lib/charts/
  config/               engine-neutral: timeSeriesDisplayToChartConfig, styles, thresholds, tags model
  v4/                   toAxesOptions, toCharts (current timeSeriesChart.ts, axisOptions.ts)
  v5/                   toPlotConfig, seriesStores, legend, export
```

All v4 imports go through `lib/charts/v4/*`, so the later switch to
`@deltares/fews-web-oc-charts/compat` (v5 phase 9) is a one-place import change.

### 3.4 v5 component internals

- `usePlot(container, config)` composable (web-oc local, shaped like PLAN-v5 §3.15 so it
  can be replaced by `@deltares/fews-web-oc-charts/vue`): `createPlot` after mount,
  `plot.update()` on config identity change, `plot.destroy()` on unmount (v4 never
  destroys – fixes a KeepAlive leak). Keep handles/stores in `shallowRef`/`markRaw`.
- `useSeriesStores(series)`: one `SeriesStore` per FEWS data resource
  (`createSeries({ x: Float64Array, y: Float64Array })`, unreliable flags → `NaN`).
  On `lastUpdated` change call `store.replace(...)`; for incremental FEWS refreshes
  (new events after the last time) call `store.append(...)` / `upsert(...)` – these are now
  genuinely incremental (tail extents, path append, LOD summaries). Marks reference the
  store, so no mark is recreated.
- Visibility: nothing to do for hidden tabs, `v-show` or `KeepAlive` – plots off-screen or
  `display: none` are suspended by the shared IntersectionObserver and catch up in one
  frame. Use `plot.pause()`/`resume()` only for explicit cases (e.g. a collapsed panel
  that is still in the viewport). Note `paused` is a plain getter, not a signal.
- `toPlotConfig(chartConfig, settings, group)` → `PlotConfig`:

  | FEWS / `ChartSeries.type` | v5 mark |
  | --- | --- |
  | `line` (+ `markerStyle`) | `series({ line, markers: { symbol } })` – one mark instead of `ChartLine` + `ChartMarker`; FEWS `diamond/square/triangleup/triangledown/circle/x/+/rectangle` → `MarkerSymbol` 1:1 (`triangleup` → `triangle-up`, `+` → `plus`) |
  | `marker` only | `series({ line: false, markers })` |
  | `area` single item | `series({ line: false, area: { to: 0 } })` |
  | `area` with two items (same legend) | `band` (y range) |
  | `area` with `lineStyle` → v4 `rule` (vertical segments per x) | **no v5 equivalent** (see §6) |
  | `bar` | `bar` |
  | `horizontalColorCode` | `heatmap` + `bandScale` y + colour scale (**discrete scale missing**, §6) |
  | `dummy` legend items | legend-only entries / `legendGroup` |
  | thresholds | `rule` marks in `legendGroup: 'Thresholds'` (labels missing until phase 6) |
  | y axes left/right | named scales `y`, `y2` + `axis({ position })` |

- Plugins: `zoom`, `pan`, `crosshair({ pointer: group.pointer })` +
  `tooltip({ crosshair, formatValue: v => String(v), formatUnit: ctx => unitOf(ctx.mark) })`
  (replaces `MouseOver` and the v4 `toolTipFormatter`/`textFormatter`),
  `crossSectionSelect` (replaces `CrossSectionSelect` for `highlightTime`),
  `legend` model only (rendering stays in Vue).
- Bridges to Vue (all public now): `subscribe(group.time.domain, d => (domain.value = d))`
  for `v-model:domain` (once per group, not per subplot); `plot.on('layoutchange')` →
  `margin` ref for the `#brush` slot and plot-weight layout; `plot.on('legendchange')` →
  legend chips. Use `{ signal }` from an `AbortController` aborted in `onScopeDispose`.
- Y-zoom bookkeeping: `plot.on('domainchange', ({ scale, explicit }) => …)` – an explicit
  y domain means the user zoomed y; `scale.update({ domain: undefined })` resumes autoscale.
- Mark IDs = `ChartSeries.id`; FEWS series sharing a legend label get the same
  `legendGroup` (replaces `Tag.seriesIds`).

## 4. Web-oc code that becomes obsolete with v5

| Today (v4 workaround) | v5 replacement |
| --- | --- |
| `useSeriesUpdateChartData` signature diffing, `updateChartData`, `hasResetAxes`, `zoomedY`, `resetAxes()` | series stores (`replace/append`) + scale `autoscale: 'visible'`; zoom state is the explicit scale `domain` (unset with `domain: undefined` to resume autoscale) |
| `refreshChart` / `clearChart` / `removeChart` diffing, `onValueChange` full rebuild | `plot.update({ marks })` reconciled by stable mark ID; option-only updates never re-ingest data |
| `setThresholdLines` + `delete y.defaultDomain` FIXME | `scale.update({ defaultDomain: undefined })` unset semantics, or `autoscale: ctx => extent([...ctx.visible, ...thresholds])` |
| `redraw(axis, config)` / `axis.redraw({ x: { autoScale } })` | no manual redraw; reactive invalidation |
| Margin `Proxy` on `axis.margin` | `plot.on('layoutchange', ({ regions }) => …)` |
| Brush margin sync watcher + `nextTick(resize)` | `layoutchange` → `brushPlot.update({ margins })` (a shared layout group would remove even this, §6 A7) |
| `TimeSeriesChartBrush` `BrushHandler` + `update:x-brush-domain` + `setBrushDomain` watcher | brush on the shared time scale / `sharedSelection` |
| v4 `toolTipFormatter` / `mouseover.textFormatter` DOM building in `timeSeriesChart.ts` | `tooltip({ formatValue, formatUnit, formatRange })` |
| `CurrentTime` visitor per chart | `sharedClock` (one timer for all plots) |
| Any web-oc "is this chart visible" logic / redraw-on-tab-activate / `KeepAlive` resize hacks | automatic visibility suspension (shared IntersectionObserver) + one catch-up frame |
| Full re-ingest of all series on every periodic FEWS refresh | `store.append/upsert` with retention (`maxPoints`/`maxAge`) |
| `resize()` with `position:absolute` + rAF, `useResizeObserver(chartContainer)` | library-owned shared `ResizeObserver` (verify flex layout behaviour) |
| `tags.ts` `drawLegendSymbol` + `XMLSerializer` + `v-html` | `plot.legend.entries` + `createLegendSwatch` / `SymbolSpec` rendered as Vue SVG |
| `toggleChartVisibility` + `redraw({ y: { autoScale } })` | `plot.legend.toggle(id)` (restacks/autoscale handled) |
| `lodash.merge` in `axisOptions.ts` | option patches with explicit unset |
| `:deep([class*='y-axis-'] > .tick) { display: … }` | axis options (`tickCount`, omit axis handle) |
| `useChartHandlers` `ZoomHandler`/`PanHandler` objects | shared scale handles |
| `AnalysisPlotChart` `Legend` visitor for PNG export | legend model + swatches composed into export SVG |
| `onCrossValueChange` → `axisTime.redraw()` | `crossSectionSelect` handle update |
| `d3.extent` domain fiddling in the component | scale options (`nice`, `includeZero`, `defaultDomain`) |
| v4 global `d3.formatDefaultLocale` side-effect, luxon time formatting | per-scale/axis `locale` and `timeZone` via `Intl` |

Kept in web-oc (domain logic, engine-neutral): FEWS display → `ChartConfig` mapping,
FEWS style parsing, unreliable-flag filtering, class breaks, forecast legend, layout
(plot weights, maximize).

## 5. Phase 4 (Sync & live) – implementation status on `next` (`7018de8`)

`PLAN-v5.md` declares **Phase 4 complete**. All six steps of its "Phase 4 Sync & live
gap assessment" are done. The user's local Chromium runs passed:
`npm run test:live:stream` (7 phases), `npm run test:live:memory` (2 fixtures),
6 Vitest browser files/82 tests (visibility, plot, public-events, shared-pointer,
shared-selection, follow) and `test:interaction:pan`.

| Phase 4 item (PLAN-v5 §3.9, §3.10, §7) | Status | Evidence |
| --- | --- | --- |
| Shared scale (`sharedScale`) | ✅ | `scales/scale.ts`, `test/Plot/plot.test.ts` |
| Domain events / public subscriptions | ✅ | `core/runtime.ts`, `test/Plot/public-events.test.ts`, README |
| `sharedPointer` + `crosshair({ pointer })` | ✅ Chromium acceptance passed | `sync/shared-pointer.ts` |
| `sharedSelection` + `brush({ selection, persistent: true })` | ✅ Chromium acceptance passed | `sync/shared-selection.ts` |
| Shared `clock` (`sharedClock`) | ✅ API; **still no consumer** (current-time mark = Phase 6; clock-driven follow not planned) | `sync/shared-clock.ts` |
| `timeScale({ follow: { window, lead } })`, suspend on zoom/pan, resume on reset | ✅ browser acceptance passed (follow suite + live-stream phase 4). Still **data-driven** | `test/Plot/follow.test.ts` |
| Series mutations + retention | ✅ | `data-store/series.ts` |
| Incremental extent / LOD reuse | ✅ block extent index, windowed extents, tail path append for simple lines, bounded M4 LOD cache with block summaries | `data-store/series.ts`, `test/Plot/series-mark.test.ts` |
| Incremental aligned-table / stack updates | ✅ circular aligned tables, block-shared stack layouts, incremental candidate validation | `data-store/table.ts`, `layout/stack.ts` |
| `plot.pause()/resume()` + shared IntersectionObserver | ✅ Cartesian, polar, Skew-T; plugins suspended; one catch-up frame | `plot/visibility.ts`, `test/Plot/visibility.test.ts` |
| Production live-stream example + runner | ✅ `examples/v5-live-stream`, `scripts/phase4-live-stream*.mjs` | PLAN checkpoint |
| Measured memory plateau | ✅ line 1M points 16.25 MiB retained, growth 74 KB; composite growth 77 KB after leak fix | `scripts/phase4-live-memory.html` |
| `linkScales(a, b, { transform })` | ❌ PLAN calls it optional; not done | – |
| `connect(series, asyncIterable \| WebSocket \| EventSource)` | ❌ PLAN calls it optional; not done | – |

Known limits that PLAN-v5 records (relevant to web-oc):

- Incremental geometry covers **line-only** series. Lines with **markers or area fills**,
  and any replace/eviction, still rebuild the full path. Most FEWS charts are line-only.
  Marker-heavy observation plots will rebuild on each append (fine at FEWS update rates).
- Prepend/upsert/replace on tables still copy full columns. Categorical keys are scanned
  in full. Neither matters for FEWS time series.
- Native SVG memory is not measured, only DOM node counts.

Issues still open in the library:

- `plot.paused` is a getter, not a signal or event, so the app cannot react to a plot
  becoming visible (e.g. lazy-load data only when visible). Minor (rec. 17).

**For web-oc:** the installed build supports W0–W3 and **W5**. Only W4 (Phase 6 marks)
is still blocked on library work.

## 6. Recommendations for v5 (library)

Priority **A = needed for web-oc parity**, **B = strong improvement**, **C = later**.
✅ = implemented in the installed build based on `7018de8`.

1. ✅ **A – Public reactivity API** (`subscribe`, `effect`, `plot.on`, DOM events). Examples
   now use it.
2. ✅ **A – Full marker symbol set** (`MarkerSymbol`, 15 shapes). Verify that legend
   swatches (`createLegendSwatch`/`SymbolSpec`) render the same shapes and rotations.
3. ✅ **A – Tooltip formatting hooks** (`formatValue`, `formatUnit`, `formatRange`).
   Still open: per-mark label/unit without a closure lookup (e.g. a `meta` field on marks
   passed through `TooltipFormatContext.mark`), and flags/comments (B10).
4. ✅ **A – Box zoom**: the `zoom` plugin supports drag-rectangle zoom, source attribution,
   and shared-scale targets (confirmed in the installed package README).
5. **A – Range-rule / error-bar mark**: vertical segments between two y values per x
   (v4 `ChartRule`), for FEWS paired-area-with-line items. Not present.
6. **A – Discrete/threshold colour scale** (`classBreaks` → colours) for `heatmap`;
   `colorScale` is still continuous only (`domain: [min, max]`, `colors`).
7. **A – Phase 6 items used by web-oc, in this order**: alert/threshold lines with labels,
   colour, label alignment and autoscale contribution (`rule` has only
   `scale/value/stroke/strokeWidth`); current-time mark driven by `sharedClock`;
   DST indicator; data field; colour bar (for `wms/ColourBar.vue`). None present yet.
8. **A – Layout alignment across plots**: `layoutGroup` / shared left/right margins.
   `layoutchange` makes the app glue small, but subplots still realign one frame late.
9. ✅ **B – `pause/resume` + shared IntersectionObserver** (Phase 4 step 5). `display: none`
   (`v-show`, inactive `KeepAlive`) does not intersect, so it is covered too.
10. **B – Export helper**: `plot.toSVG({ inlineStyles, legend })` / `toBlob()`.
11. **B – Missing value & flag styling** (plan §8).
12. **B – Ship `./compat` and `./vue` subpaths early.** `subscribe` now exists, so
    `usePlot`/`useLegend` can be built; `exports` still has only the root entry.
13. ✅ **B – Shared pointer** (`sharedPointer`).
14. **B – Clock-driven follow** (new): an option to let `follow` advance with
    `sharedClock` (e.g. `follow: { window: '48h', lead: '6h', clock }`), so forecast
    displays slide with real time even without new data.
15. **C – Forecast-aware time axis**, time-dependent thresholds, editable points,
    ensembles (phase 5), small-multiples helper, worker offloading.
16. **C – Line interpolation/curve** option on `series`/`line` (exists on `band` only).
17. **C – Observable visibility** (new): expose `paused` as a signal or a
    `visibilitychange` plot event, so apps can defer data fetches for off-screen subplots.
18. **C – Incremental geometry for markers/areas** (new): extend tail-append path reuse
    beyond line-only series (FEWS observation series often use markers).
19. **C – `linkScales`/`connect`** (Phase 4 optional): only `connect` is useful
    to web-oc, if FEWS ever pushes data over SSE/WebSocket. Otherwise leave both out.

## 7. Implementation phases in web-oc

| # | Work | Depends on library | Exit criterion |
| --- | --- | --- | --- |
| W0 | Engine switch setting + URL override, `TimeSeriesChartSwitch`, engine-neutral `ChartConfig`/props/`ChartGroup`, move v4 code to `lib/charts/v4` | – | v4 behaviour unchanged (unit + e2e tests green); `?charts.engine=v5` mounts a placeholder |
| W1 | Static v5 chart: `usePlot`, series stores, `toPlotConfig` for line/marker (all FEWS shapes)/area/band/bar, left/right y axes, time/value/degrees axes, theme (`themeElement`), automargins, settings (labels, ticks) | ✅ available | Side-by-side visual check of representative FEWS displays |
| W2 | Implemented interaction: box zoom/pan/wheel mode, crosshair + tooltip with FEWS formatting, `highlightTime` via `crossSectionSelect`, legend via `legendchange` + swatches in `ChartLegend`/`Overlay` (engine-neutral `Tag`) | ✅ available | Toggle, isolate, zoom, reset, pan work on one subplot |
| W3 | Multi-subplot sync: shared time scale, `sharedPointer`, `v-model:domain` via `subscribe`, shared-selection brush with a full-domain overview scale, margins via `layoutchange` | ✅ available (rec. 8 optional) | Implemented; focused sync tests and production build pass. Representative-display visual parity remains part of W6 hardening. |
| W4 | Thresholds (rule + text interim), current time (`sharedClock` + rule interim), horizontalColorCode (heatmap), vertical profile (shared y), Analysis charts + PNG export, SSD display | rec. 5, 6, 7, 10 | All chart display types render under v5 |
| W5 | Live/perf: `append/upsert` on incremental FEWS updates, retention, optional `follow`; verify hidden plots idle (automatic) | ✅ available (Phase 4 complete) | No full rebuild on data refresh; hidden plots idle |
| W6 | Parity hardening: Playwright e2e for both engines (parametrise on `?charts.engine`), perf comparison, docs; flip default to v5, keep v4 one release, then delete v4 code and `compat` import | 5.0.0 | v5 default; v4 removed |

W0–W3 and W5 can start now (W5 after W1). W4 can start with interim marks, but full parity waits on Phase 6.

## 8. Risks

- **Package versioning**: the tgz is labelled 4.7.2 but contains v5; at 5.0.0 the v4
  API moves to `./compat` → mitigated by §3.3 import centralisation.
- **API churn on `next`**: keep all v5 calls in `lib/charts/v5` + `usePlot`.
- **Reactivity bridging**: never put stores/handles/typed arrays in deep Vue reactivity.
- **Export**: canvas-rendered marks are absent from `plot.element` SVG; keep SVG renderer
  for exportable charts until B9.
- **Bundle size**: both engines in the bundle during transition; lazy-load v5.
