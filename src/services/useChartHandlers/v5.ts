import {
  alignGroup,
  linearScale,
  sharedPointer,
  sharedSelection,
  timeScale,
} from '@deltares/fews-web-oc-charts'
import type { V5ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'
import type { ChartAxis } from '@/lib/charts/types/ChartAxis'
import { shouldKeepVisibleTimeRange } from '@/lib/charts/zoom'

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
  if (group[initializedKey] && sameRange(previousDefault, values)) {
    return
  }

  // A moving period, e.g. a running period after a sync, keeps a zoom
  const current = group[scale].domain.get()
  const keepZoom =
    group[initializedKey] &&
    shouldKeepVisibleTimeRange(current, previousDefault, values)
  group[scale].update({
    domain: keepZoom ? [Number(current[0]), Number(current[1])] : values,
    defaultDomain: values,
  })
  group[initializedKey] = true
}

export function updateTimeScaleDomain(
  scale: V5ChartGroup['timeScale'],
  domain: [Date, Date] | undefined,
): void {
  if (!domain) return

  const next: [number, number] = [domain[0].getTime(), domain[1].getTime()]
  if (sameRange(scale.domain.get(), next)) return

  scale.update({ domain: next })
}

/** Show the default domain of the scale again, e.g. after a period change */
export function resetTimeScaleDomain(scale: V5ChartGroup['timeScale']): void {
  const defaultDomain = scale.options.get().resolved.defaultDomain
  if (sameRange(scale.domain.get(), defaultDomain)) return

  scale.update({ domain: [Number(defaultDomain[0]), Number(defaultDomain[1])] })
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
  if (sameRange(current, next)) return

  group.selection.setSelection({
    mode: 'x',
    ranges: [{ scale: group.brushTimeScale, axis: 'x', range: next }],
  })
}

// Date round-trips truncate to whole milliseconds; treat sub-ms differences as
// equal so echoing a domain back does not abort an in-progress brush gesture.
function sameRange(
  current: readonly unknown[] | undefined,
  next: readonly number[],
): boolean {
  return (
    current?.length === next.length &&
    current.every(
      (value, index) =>
        typeof value === 'number' && Math.abs(value - next[index]) < 1,
    )
  )
}
