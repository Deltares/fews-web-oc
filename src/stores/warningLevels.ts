import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import type { WarningLevel } from '@/lib/thresholds'

export const useWarningLevelsStore = defineStore('warningLevels', () => {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const nodeId = ref<string>()
  const selectedWarningLevelIds = ref<string[]>([])

  const { thresholds: topologyThresholds } = useTopologyThresholds(
    baseUrl,
    nodeId,
  )

  const thresholds = computed(() => topologyThresholds.value?.[0])

  const _crossings = computed(
    () => thresholds.value?.levelThresholdCrossings ?? [],
  )
  const _aggregatedWarningLevels = computed(
    () => thresholds.value?.aggregatedLevelThresholdWarningLevels ?? [],
  )
  const _warningLevels = computed(
    () => thresholds.value?.levelThresholdWarningLevels ?? [],
  )

  function getCrossingsCountForLevel(levelId: string): number {
    return _crossings.value.filter(
      (crossing) => crossing.warningLevelId === levelId,
    ).length
  }

  function getAggregatedCountForLevel(levelId: string): number {
    const aggregatedLevel = _aggregatedWarningLevels.value.find(
      (aggLevel) => aggLevel.id === levelId,
    )
    return aggregatedLevel?.count ?? 0
  }

  const warningLevels = computed<WarningLevel[]>(() =>
    _warningLevels.value
      .map((level) => {
        const parameters = level.parameterWarningLevelCount ?? []
        const count = parameters.reduce((a, b) => a + b.count, 0) ?? 0
        const icon = level.icon ? getResourcesIconsUrl(level.icon) : undefined

        // For warning levels with severity 0 we have no crossings
        const locationCount =
          level.severity === 0
            ? getAggregatedCountForLevel(level.id)
            : getCrossingsCountForLevel(level.id)

        return {
          ...level,
          count,
          locationCount,
          icon,
        }
      })
      .sort((a, b) => b.severity - a.severity),
  )

  const crossings = computed(() =>
    _crossings.value
      .map((crossing) => ({
        ...crossing,
        icon: crossing.icon ? getResourcesIconsUrl(crossing.icon) : '',
      }))
      .sort((a, b) => b.severity - a.severity),
  )

  const selectedCrossings = computed(() => {
    if (selectedWarningLevelIds.value.length === 0) return crossings.value

    return crossings.value.filter((crossing) =>
      selectedWarningLevelIds.value.includes(crossing.warningLevelId ?? ''),
    )
  })

  const selectedWarningLevels = computed(() => {
    if (selectedWarningLevelIds.value.length === 0) return warningLevels.value

    return warningLevels.value.filter((level) =>
      selectedWarningLevelIds.value.includes(level.id),
    )
  })

  function setTopologyNodeId(id: string | undefined) {
    nodeId.value = id
  }

  return {
    nodeId,
    selectedWarningLevelIds,
    selectedWarningLevels,
    warningLevels,
    thresholds,
    crossings,
    selectedCrossings,
    setTopologyNodeId,
  }
})
