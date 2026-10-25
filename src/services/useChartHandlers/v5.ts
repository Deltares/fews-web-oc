import {
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

  const values = domain.map((value) =>
    value instanceof Date ? value.getTime() : value,
  )
  group[scale].update({ domain: values, defaultDomain: values })
  group[initializedKey] = true
}

export function updateTimeScaleDomain(
  scale: V5ChartGroup['timeScale'],
  domain: [Date, Date] | undefined,
): void {
  if (!domain) return

  const next = domain.map((value) => value.getTime())
  const current = scale.domain.get()
  if (current[0] === next[0] && current[1] === next[1]) return

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

  group.selection.setSelection({
    mode: 'x',
    ranges: [
      {
        scale: group.brushTimeScale,
        axis: 'x',
        range: domain.map((value) => value.getTime()),
      },
    ],
  })
}
