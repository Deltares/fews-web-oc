<template>
  <SidePanelContent :title="t('sidePanel.thresholds')" @close="emit('close')">
    <div>
      <v-menu v-if="!onlyOneParameter">
        <template #activator="{ props, isActive }">
          <v-chip
            variant="tonal"
            pilled
            label
            v-bind="props"
            class="mt-2 ms-2"
            prepend-icon="mdi-sigma"
          >
            <template #default>
              <span>{{ countType }}</span>
              <v-spacer />
              <SelectIcon :active="isActive" />
            </template>
          </v-chip>
        </template>
        <v-list density="compact">
          <v-list-subheader>{{ t('thresholds.countBy') }}</v-list-subheader>
          <v-list-item
            v-for="type in countTypes"
            :title="type"
            :active="countType === type"
            @click="countType = type"
          />
        </v-list>
      </v-menu>
      <v-chip-group
        class="px-2 py-2 d-flex flex-wrap flex-0-0"
        v-model="warningLevelsStore.selectedWarningLevelIds"
        multiple
        column
        selected-class="v-chip--variant-tonal"
      >
        <template
          v-for="(level, index) in warningLevelsStore.warningLevels"
          :key="level.id"
        >
          <div
            v-if="showSeverityZeroSeparator(index)"
            class="w-100 my-1 severity-zero-separator"
            aria-hidden="true"
          ></div>
          <v-chip
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
                :text="
                  countType === 'Location' ? level.locationCount : level.count
                "
                density="compact"
                variant="flat"
                class="ms-2 pa-1 pointer-events-none"
                size="small"
              />
            </template>
          </v-chip>
        </template>
      </v-chip-group>
      <div v-if="warningLevelsStore.warningLevels.length === 0" class="pa-2">
        {{ t('thresholds.noThresholdCrossing') }}
      </div>
      <!-- Important to have item-height as it greatly improves performance -->
      <v-virtual-scroll
        ref="virtualScroll"
        class="scroll-container flex-1-1"
        :items="groupedCrossings"
        :item-height="52"
      >
        <template #default="{ item: crossingsGroup }">
          <div class="my-1 mx-2">
            <ThresholdSummary
              :crossings="crossingsGroup"
              :isSelected="crossingsGroup[0].locationId === locationIds"
              :selectable="selectable"
              @navigate="emit('navigate', $event)"
            />
          </div>
        </template>
      </v-virtual-scroll>
    </div>
  </SidePanelContent>
</template>

<script setup lang="ts">
import type {
  LevelThresholdCrossings,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { computed, watch, nextTick, onMounted, useTemplateRef, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { NavigateRoute } from '@/lib/router/types'
import { nodeHasMap } from '@/lib/topology/nodes'

import { useWarningLevelsStore } from '@/stores/warningLevels'

import SelectIcon from '@/components/general/SelectIcon.vue'
import ThresholdSummary from '@/components/thresholds/ThresholdSummary.vue'
import SidePanelContent from './SidePanelContent.vue'

const { t } = useI18n()
const warningLevelsStore = useWarningLevelsStore()

interface Props {
  topologyNode?: TopologyNode
  locationIds?: string
}
const props = defineProps<Props>()

interface Emits {
  close: []
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()

const selectable = computed<boolean>(() => {
  const node = props.topologyNode
  return node !== undefined && nodeHasMap(node)
})

const virtualScroll = useTemplateRef('virtualScroll')

const countTypes = ['Location', 'Parameter'] as const
const countType = ref<(typeof countTypes)[number]>('Location')

const groupedCrossings = computed(() => {
  const grouped: Record<string, LevelThresholdCrossings[]> = {}
  warningLevelsStore.selectedCrossings.forEach((crossing) => {
    const key = crossing.locationId
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(crossing)
  })
  return Object.values(grouped)
})

const onlyOneParameter = computed(() =>
  warningLevelsStore.warningLevels.every(
    (level) => level.parameterWarningLevelCount?.length === 1,
  ),
)

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

function showSeverityZeroSeparator(index: number): boolean {
  if (index <= 0) return false
  const levels = warningLevelsStore.warningLevels
  const currentSeverity = levels[index]?.severity
  const previousSeverity = levels[index - 1]?.severity
  return currentSeverity === 0 && previousSeverity !== 0
}
</script>

<style scoped>
.severity-zero-separator {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.2);
}
</style>
