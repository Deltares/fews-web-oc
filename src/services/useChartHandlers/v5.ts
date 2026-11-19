import {
  alignGroup,
  linearScale,
  sharedPointer,
  sharedSelection,
  timeScale,
} from '@deltares/fews-web-oc-charts'
import type { V5ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'
import type { ChartAxis } from '@/lib/charts/types/ChartAxis'
import { isSameTimeRange } from '@/lib/charts/zoom'

export function createV5ChartGroup(): V5ChartGroup {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  return {
    timeScale: timeScale({ defaultDomain: [0, 1], locale, timeZone }),
    brushTimeScale: timeScale({ defaultDomain: [0, 1], locale, timeZone }),
    elevationScale: linearScale({ defaultDomain: [0, 1], locale, timeZone }),
    pointer: sharedPointer({ by: 'x' }),
    elevationPointer: sharedPointer({ by: 'y' }),
    align: alignGroup(),
    selection: sharedSelection(),
    timeScaleInitialized: false,
    brushTimeScaleInitialized: false,
    elevationScaleInitialized: false,
  }
}

export function initializeV5ElevationScale(
  group: V5ChartGroup | undefined,
  axis: ChartAxis | undefined,
): void {
  if (!group || group.elevationScaleInitialized) return

  group.elevationScale.update({
    domain: axis?.domain
      ? [Number(axis.domain[0]), Number(axis.domain[1])]
      : undefined,
    defaultDomain: axis?.defaultDomain ?? [0, 1],
    includeZero: axis?.includeZero ?? false,
    nice: axis?.nice ?? true,
    reverse: axis?.reverse ?? false,
    ...(axis?.locale ? { locale: axis.locale } : {}),
  })
  group.elevationScaleInitialized = true
}

/**
 * Set the default domain of a shared time scale. The scale shows it until the
 * user zooms, which sets an explicit domain; a reset clears that domain again.
 * A user zoom is kept, e.g. when a running period moves with the system time.
 * The brush overview always shows its default domain.
 */
export function initializeV5TimeScale(
  group: V5ChartGroup | undefined,
  scale: 'timeScale' | 'brushTimeScale',
  domain: [Date, Date] | [number, number] | undefined,
): void {
  if (!group || !domain) return
  const initializedKey =
    scale === 'timeScale' ? 'timeScaleInitialized' : 'brushTimeScaleInitialized'
  const values: [number, number] = [Number(domain[0]), Number(domain[1])]
  const previousDefault = group[scale].options.get().resolved.defaultDomain
  if (group[initializedKey] && isSameTimeRange(previousDefault, values)) {
    return
  }

  group[scale].update({
    autoscale: 'fixed',
    defaultDomain: values,
    ...(scale === 'brushTimeScale' ? { domain: undefined } : {}),
  })
  group[initializedKey] = true
}

export function updateTimeScaleDomain(
  scale: V5ChartGroup['timeScale'],
  domain: [Date, Date] | undefined,
): void {
  if (!domain) return

  const next: [number, number] = [domain[0].getTime(), domain[1].getTime()]
  if (isSameTimeRange(scale.domain.get(), next)) return

  scale.update({ domain: next })
}

/** Show the default domain of the scale again, e.g. after a period change */
export function resetTimeScaleDomain(scale: V5ChartGroup['timeScale']): void {
  if (scale.options.get().explicit.domain === undefined) return

  scale.update({ domain: undefined })
}

export function updateBrushSelection(
  group: V5ChartGroup,
  domain: [Date, Date] | undefined,
): void {
  if (!domain) {
    group.selection.setSelection(undefined)
    return
  }

  const next = domain.map((value) => value.getTime())
  const current = group.selection.selection
    .get()
    ?.ranges.find(({ axis }) => axis === 'x')?.range
  // Echoing the same domain back would abort an in-progress brush gesture
  if (isSameTimeRange(current, next)) return

  group.selection.setSelection({
    mode: 'x',
    ranges: [{ scale: group.brushTimeScale, axis: 'x', range: next }],
  })
}
