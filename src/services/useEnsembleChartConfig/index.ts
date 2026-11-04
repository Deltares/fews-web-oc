import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'

export function useEnsembleChartConfig(
  config: MaybeRefOrGetter<ChartConfig>,
  series: MaybeRefOrGetter<Record<string, Series>>,
) {
  const members = computed(
    (previous?: { id: string; requestKey: string }[]) => {
      const next = Object.entries(toValue(series)).flatMap(([id, resource]) =>
        resource.ensemble
          ? [{ id, requestKey: resource.ensemble.requestKey }]
          : [],
      )
      // Data refreshes should update curves without rebuilding the chart config.
      if (
        previous?.length === next.length &&
        next.every(
          (member, index) =>
            member.id === previous[index].id &&
            member.requestKey === previous[index].requestKey,
        )
      ) {
        return previous
      }
      return next
    },
  )

  return computed(() => {
    const original = toValue(config)
    if (members.value.length === 0) return original
    return {
      ...original,
      series: original.series.flatMap((item) => {
        if (item.dataResources.length !== 1) return [item]
        const matching = members.value.filter(
          (member) => member.requestKey === item.dataResources[0],
        )
        if (matching.length === 0) return [item]
        return matching.map((member) => ({
          ...item,
          id: `${item.id}:${member.id}`,
          dataResources: [member.id],
          editable: false,
        }))
      }),
    }
  })
}
