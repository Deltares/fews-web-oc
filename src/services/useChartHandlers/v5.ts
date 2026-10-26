import {
  alignGroup,
  sharedPointer,
  sharedSelection,
  timeScale,
} from '@deltares/fews-web-oc-charts'
import type { V5ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'

export function createV5ChartGroup(): V5ChartGroup {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  return {
    timeScale: timeScale({ defaultDomain: [0, 1], locale, timeZone }),
    brushTimeScale: timeScale({ defaultDomain: [0, 1], locale, timeZone }),
    pointer: sharedPointer({ by: 'x' }),
    align: alignGroup(),
    selection: sharedSelection(),
    timeScaleInitialized: false,
    brushTimeScaleInitialized: false,
  }
}

export function initializeV5TimeScale(
  group: V5ChartGroup | undefined,
  scale: 'timeScale' | 'brushTimeScale',
  domain: [Date, Date] | [number, number] | undefined,
): void {
  if (!group || !domain) return
  const initializedKey =
    scale === 'timeScale' ? 'timeScaleInitialized' : 'brushTimeScaleInitialized'
  if (group[initializedKey]) return

  const values: [number, number] = [Number(domain[0]), Number(domain[1])]
  group[scale].update({ domain: values, defaultDomain: values })
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
