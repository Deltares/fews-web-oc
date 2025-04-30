<template>
  <div class="threshold-summary-container h-100 d-flex flex-column">
    <div v-if="warningLevels.length === 0" class="pa-2">
      No active threshold crossings
    </div>
    <v-chip-group
      class="px-2 flex-0-0"
      v-model="selectedWarningLevelIds"
      multiple
      column
      selected-class="v-chip--variant-tonal"
    >
      <v-chip
        v-for="level in warningLevels"
        :key="level.id"
        :value="level.id"
        :text="level.name"
        label
        variant="text"
        class="pe-0 ps-2"
        border
      >
        <template #prepend>
          <v-img width="20" height="20" :src="level.icon" class="me-1" />
        </template>
        <template #append>
          <v-chip
            :text="level.count"
            density="compact"
            variant="flat"
            class="ms-2 pa-1 pointer-events-none"
            size="small"
          />
        </template>
      </v-chip>
    </v-chip-group>

    <!-- Important to have item-height as it greatly improves performance -->
    <v-virtual-scroll
      ref="virtualScroll"
      class="scroll-container h-100"
      :items="groupedCrossings"
      :item-height="52"
    >
      <template #default="{ item: crossingsGroup }">
        <div class="my-1 mx-2">
          <ThresholdSummary
            v-model:expanded="expandedItems[crossingsGroup[0].locationId]"
            :crossings="crossingsGroup"
            :isSelected="isLocationSelected(crossingsGroup[0].locationId)"
          />
        </div>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import type { WarningLevel } from '@/lib/thresholds'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import ThresholdSummary from '@/components/thresholds/ThresholdSummary.vue'
import { computed, ref, watch, nextTick, onMounted, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  warningLevels: WarningLevel[]
  crossings: LevelThresholdCrossings[]
  selectedThresholdCrossings: LevelThresholdCrossings[]
}

const props = defineProps<Props>()

const selectedWarningLevelIds = defineModel<string[]>('selectedWarningLevelIds')
const expandedItems = ref<Record<string, boolean>>({})
const route = useRoute()
const virtualScroll = useTemplateRef('virtualScroll')

function getRouteLocationIds(): string[] {
  if (typeof route.params.locationIds === 'string') {
    return route.params.locationIds.split(',')
  }
  return Array.isArray(route.params.locationIds) ? route.params.locationIds : []
}

const isLocationSelected = computed(() => {
  const routeLocationIds = getRouteLocationIds()
  return (locationId: string): boolean => {
    return routeLocationIds.includes(locationId)
  }
})

const groupedCrossings = computed(() => {
  const grouped: Record<string, LevelThresholdCrossings[]> = {}
  props.selectedThresholdCrossings.forEach((crossing) => {
    const key = crossing.locationId
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(crossing)
  })
  return Object.values(grouped)
})

// Scroll to the selected item
async function scrollToSelectedItem() {
  const locationIds = getRouteLocationIds()
  if (locationIds.length === 0 || !virtualScroll.value) return
  const selectedIndex = groupedCrossings.value.findIndex((group) =>
    locationIds.includes(group[0].locationId),
  )
  if (selectedIndex !== -1) {
    // Wait for the next DOM update cycle
    await nextTick()
    // Scroll to the item
    virtualScroll.value.scrollToIndex(selectedIndex)
  }
}

watch([() => route.params.locationIds, groupedCrossings], () => {
  scrollToSelectedItem()
})

// Scroll to the selected item when we directly navigate to the page
onMounted(() => {
  scrollToSelectedItem()
})
</script>

<style scoped>
.threshold-summary-container {
  width: 450px;
}

.warning-count {
  text-align: center;
}

.v-list-item-subtitle {
  font-size: 0.8em;
  color: var(--v-theme-on-surface);
  opacity: 1;
  width: 100%;
  text-align: center;
}

:deep(.v-list-item__content) {
  overflow: visible !important;
  width: 65px;
}

:deep(.v-chip__content) {
  width: 100%;
}
</style>
