import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { LevelThresholdWarningLevels } from '@deltares/fews-pi-requests'
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import type { WarningLevel } from '@/lib/thresholds'

export const useWarningLevelsStore = defineStore('warningLevels', () => {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const nodeId = ref<string | undefined>(undefined)
  const selectedWarningLevelIds = ref<string[]>([])
  const selectedWarningLevels = ref<LevelThresholdWarningLevels[]>([])
  const showCrossingDetails = ref(false)

  const { thresholds } = useTopologyThresholds(baseUrl, () => nodeId.value)

  const aggregatedWarningLevels = computed(() => {
    if (thresholds.value === undefined || thresholds.value.length === 0)
      return []
    const aggregatedLevels =
      thresholds.value[0]?.aggregatedLevelThresholdWarningLevels
    return aggregatedLevels ?? []
  })

  const warningLevels = computed<WarningLevel[]>(() => {
    const levels = aggregatedWarningLevels.value
      .map((warningLevel) => {
        return {
          ...warningLevel,
          ...{
            icon: warningLevel.icon
              ? getResourcesIconsUrl(warningLevel.icon)
              : undefined,
          },
        }
      })
      .sort((a, b) => b.severity - a.severity)
    // The warning level with the lowest severity is always the default "no thresholds" level.
    // That level should not be shown in list of warning levels
    if (levels.length > 0) {
      levels.pop()
    }
    return levels
  })

  const thresholdCrossings = computed(() => {
    if (thresholds.value === undefined || thresholds.value.length === 0)
      return []
    return (thresholds.value[0].levelThresholdCrossings ?? []).map(
      (crossing) => {
        return {
          ...crossing,
          ...{
            icon: crossing.icon ? getResourcesIconsUrl(crossing.icon) : '',
          },
        }
      },
    )
  })

  const selectedThresholdCrossings = computed(() => {
    const crossings =
      selectedWarningLevelIds.value.length === 0
        ? thresholdCrossings.value
        : thresholdCrossings.value?.filter((crossing) =>
            selectedWarningLevelIds.value.includes(
              crossing.warningLevelId ?? '',
            ),
          )
    return crossings.sort((a, b) => b.severity - a.severity)
  })

  const aggregatedThresholdCrossings = computed(() => {
    if (thresholds.value === undefined || thresholds.value.length === 0)
      return []
    return thresholds.value[0].aggregatedLevelThresholdCrossings ?? []
  })

  const selectedAggregatedThresholdCrossings = computed(() => {
    const crossings =
      selectedWarningLevelIds.value.length === 0
        ? aggregatedThresholdCrossings.value
        : aggregatedThresholdCrossings.value?.filter((crossing) =>
            selectedWarningLevelIds.value.includes(
              crossing.warningLevelId ?? '',
            ),
          )
    return crossings.sort((a, b) => b.severity - a.severity)
  })

  watch([selectedWarningLevelIds, aggregatedWarningLevels], () => {
    updateSelectedLevels()
  })

  watch(aggregatedWarningLevels, () => {
    updateSelectedLevels()
  })

  // Update the selected levels based on selected IDs
  function updateSelectedLevels() {
    if (selectedWarningLevelIds.value.length === 0) {
      selectedWarningLevels.value = aggregatedWarningLevels.value
    } else {
      selectedWarningLevels.value = aggregatedWarningLevels.value.filter(
        (level) => selectedWarningLevelIds.value.includes(level.id),
      )
    }
  }

  function setTopologyNodeId(id: string | undefined) {
    nodeId.value = id
  }

  return {
    nodeId,
    selectedWarningLevelIds,
    selectedWarningLevels,
    warningLevels,
    aggregatedWarningLevels,
    thresholds,
    thresholdCrossings,
    selectedThresholdCrossings,
    aggregatedThresholdCrossings,
    selectedAggregatedThresholdCrossings,
    showCrossingDetails,
    setTopologyNodeId,
  }
})
