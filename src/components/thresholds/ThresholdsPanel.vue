<template>
  <div class="threshold-summary-container h-100 d-flex flex-column">
    <v-toolbar density="compact" height="100%">
      Thresholds
      <template #append>
        <v-btn
          @click="emit('close')"
          size="small"
          variant="text"
          icon="mdi-close"
        />
      </template>
    </v-toolbar>
    <v-chip-group
      class="px-2 py-2 d-flex flex-wrap"
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
    <div v-if="warningLevels.length === 0" class="pa-2">
      No active threshold crossings
    </div>
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
            :crossings="crossingsGroup"
            :isSelected="crossingsGroup[0].locationId === props.locationIds"
            @navigate="emit('navigate', $event)"
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
import { computed, watch, nextTick, onMounted, useTemplateRef } from 'vue'
import { NavigateRoute } from '@/lib/router/types'

interface Props {
  warningLevels: WarningLevel[]
  crossings: LevelThresholdCrossings[]
  selectedThresholdCrossings: LevelThresholdCrossings[]
  locationIds?: string
}

const props = defineProps<Props>()

interface Emits {
  navigate: [to: NavigateRoute]
  close: []
}
const emit = defineEmits<Emits>()

const selectedWarningLevelIds = defineModel<string[]>('selectedWarningLevelIds')
const virtualScroll = useTemplateRef('virtualScroll')

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
  if (!virtualScroll.value) return
  const selectedIndex = groupedCrossings.value.findIndex(
    (group) => group[0].locationId === props.locationIds,
  )
  if (selectedIndex !== -1) {
    // Wait for the next DOM update cycle
    await nextTick()
    // Scroll to the item
    virtualScroll.value.scrollToIndex(selectedIndex)
  }
}

watch([() => props.locationIds, groupedCrossings], () => {
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

.spacer {
  height: 48px;
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
