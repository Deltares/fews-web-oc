<template>
  <BtnGroup class="me-2">
    <template #persistent v-if="showActiveThresholdCrossingsForFilters">
      <ThresholdsButton
        :active="isThresholdsOpen"
        @click="toggleThresholdsSidePanel()"
      />
    </template>

    <v-btn
      v-if="menuSidePanel !== null"
      :active="rootPanelType === menuSidePanel.type"
      size="small"
      icon
      @click="toggleSidePanel(menuSidePanel.type)"
    >
      <v-icon :icon="menuSidePanel.icon"></v-icon>
    </v-btn>

    <v-menu v-if="enabledSidePanels.length > 1" location="bottom right">
      <template #activator="{ isActive, props }">
        <v-btn
          icon
          v-bind="props"
          aria-label="More Sidepanel Options"
          size="small"
        >
          <v-icon :icon="isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="sidePanel in enabledSidePanels"
          :key="sidePanel.type"
          :prepend-icon="sidePanel.icon"
          :title="getTitleForSidePanel(sidePanel.type)"
          :active="rootPanelType === sidePanel.type"
          @click="openSidePanel(sidePanel.type)"
        />
      </v-list>
    </v-menu>
  </BtnGroup>

  <SidePanelContent
    v-if="activePanel !== null"
    :title="getTitleForSidePanel(activePanel.type)"
    :can-go-back="canGoBack"
    class="h-100"
    @back="popPanel()"
    @close="closePanels()"
  >
    <div
      v-for="(panel, index) in panelStack"
      v-show="index === panelStack.length - 1"
      :key="`${index}-${panel.type}`"
      class="d-flex flex-column flex-1-1 overflow-hidden"
    >
      <component
        :is="getComponentForSidePanel(panel.type)"
        :topology-node="topologyNode"
        v-bind="propsForSidePanel(panel)"
        @open-log-task-run="openLogSidePanelForTaskRun"
      />
    </div>
  </SidePanelContent>

  <ThresholdsSidePanel
    v-if="isThresholdsOpen"
    :topologyNode="topologyNode"
    :locationIds="locationIds"
    @close="isThresholdsOpen = false"
    @navigate="emit('navigate', $event)"
  />
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { type Component, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { NavigateRoute } from '@/lib/router'
import {
  getEnabledSidePanels,
  type SidePanel,
  type SidePanelType,
} from '@/lib/sidepanel'

import { useConfigStore } from '@/stores/config'
import { useLogDisplay } from '@/services/useLogDisplay'
import {
  useSidePanelStack,
  type OpenSidePanel,
} from '@/services/useSidePanelStack'

import BtnGroup from '@/components/general/BtnGroup.vue'
import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'
import SidePanelContent from '@/components/sidepanel/SidePanelContent.vue'
import ThresholdsSidePanel from '@/components/sidepanel/ThresholdsSidePanel.vue'

interface Props {
  topologyNode?: TopologyNode
  locationIds?: string
  showActiveThresholdCrossingsForFilters?: boolean
}
defineProps<Props>()

interface Emits {
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()

const { t } = useI18n()
const configStore = useConfigStore()

const enabledSidePanels = computed<SidePanel[]>(() =>
  getEnabledSidePanels(configStore.general.sidePanel),
)

const {
  stack: panelStack,
  activePanel,
  rootPanelType,
  canGoBack,
  open: openPanel,
  push: pushPanel,
  pop: popPanel,
  close: closePanels,
} = useSidePanelStack(() =>
  enabledSidePanels.value.map((sidePanel) => sidePanel.type),
)

// Only one side panel is shown in the top bar at all times; the others are
// available from the menu next to it.
const menuSidePanelType = ref<SidePanelType | null>(
  enabledSidePanels.value[0]?.type ?? null,
)
const menuSidePanel = computed<SidePanel | null>(
  () => findSidePanel(menuSidePanelType.value) ?? null,
)

// The thresholds side panel is a special panel with its own permanent button
// and component, so it cannot be part of the stack.
const isThresholdsOpen = ref(false)

const logDisplayId = computed(
  () => configStore.general.sidePanel?.logDisplay?.logDisplayId,
)
const { logDisplay } = useLogDisplay(logDisplayId)

function findSidePanel(type: SidePanelType | null): SidePanel | undefined {
  if (type === null) return undefined
  return enabledSidePanels.value.find((sidePanel) => sidePanel.type === type)
}

function getComponentForSidePanel(type: SidePanelType): Component | undefined {
  return findSidePanel(type)?.component
}

function getTitleForSidePanel(type: SidePanelType): string {
  const title = t(`sidePanel.${type}`)

  if (type === 'logDisplay') {
    return logDisplay.value?.name ?? title
  }

  return title
}

function propsForSidePanel(panel: OpenSidePanel): Record<string, unknown> {
  if (panel.type === 'logDisplay') {
    return { logDisplayId: logDisplayId.value, ...panel.props }
  }

  return panel.props
}

function openSidePanel(type: SidePanelType): void {
  isThresholdsOpen.value = false
  menuSidePanelType.value = type
  openPanel(type)
}

function toggleSidePanel(type: SidePanelType): void {
  if (rootPanelType.value === type) {
    closePanels()
  } else {
    openSidePanel(type)
  }
}

function toggleThresholdsSidePanel(): void {
  isThresholdsOpen.value = !isThresholdsOpen.value
  if (isThresholdsOpen.value) closePanels()
}

function openLogSidePanelForTaskRun(taskRunId: string): void {
  pushPanel('logDisplay', { taskRunId })
}
</script>
