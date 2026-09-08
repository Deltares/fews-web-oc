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
      :active="openPanelType === menuSidePanel.type"
      size="small"
      icon
      @click="toggleSidePanel(menuSidePanel.type)"
    >
      <v-icon :icon="menuSidePanel.icon"></v-icon>
    </v-btn>

    <v-menu v-if="hasMultipleEnabledSidePanels" location="bottom right">
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
          v-for="sidePanel in enabledGeneralSidePanels"
          :key="sidePanel.type"
          :prepend-icon="sidePanel.icon"
          :title="getTitleForSidePanel(sidePanel.type)"
          :active="openPanelType === sidePanel.type"
          @click="openSidePanel(sidePanel.type)"
        />
      </v-list>
    </v-menu>
  </BtnGroup>

  <SidePanelContent
    v-if="activePanel !== null"
    :title="getTitleForSidePanel(activePanel.type)"
    :can-go-back="panelStack.length > 1"
    class="h-100"
    @back="popSidePanel()"
    @close="closeSidePanel()"
  >
    <!--
      All panels in the stack stay mounted, so that panels that are temporarily
      overlaid by another panel do not lose their state. Only the top-most panel
      of the stack is visible.
    -->
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
        @open-log-task-run="openLogTaskRunSidePanel"
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
import type { SidePanelConfig, TopologyNode } from '@deltares/fews-pi-requests'
import { type Component, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { NavigateRoute } from '@/lib/router'

import { useConfigStore } from '@/stores/config'

import BtnGroup from '@/components/general/BtnGroup.vue'
import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'

import SidePanelContent from '@/components/sidepanel/SidePanelContent.vue'
import ImportStatusSidePanel from '@/components/sidepanel/ImportStatusSidePanel.vue'
import LogSidePanel from '@/components/sidepanel/LogSidePanel.vue'
import MoreInfoSidePanel from '@/components/sidepanel/MoreInfoSidePanel.vue'
import NonCurrentDataSidePanel from '@/components/sidepanel/NonCurrentDataSidePanel.vue'
import RunTasksSidePanel from '@/components/sidepanel/RunTasksSidePanel.vue'
import ShareSidePanel from '@/components/sidepanel/ShareSidePanel.vue'
import TaskOverviewSidePanel from '@/components/sidepanel/TaskOverviewSidePanel.vue'
import ThresholdsSidePanel from '@/components/sidepanel/ThresholdsSidePanel.vue'
import { useLogDisplay } from '@/services/useLogDisplay'

const { t } = useI18n()
const configStore = useConfigStore()

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

// FIXME: Remove 'share' once SidePanel configuration is implemented for it.
type GeneralSidePanelType = Exclude<
  keyof SidePanelConfig | 'share',
  'exportStatus'
>

interface GeneralSidePanel {
  type: GeneralSidePanelType
  icon: string
  component: Component
}

/**
 * A side panel that is currently open, with the props it was opened with.
 *
 * Side panels are kept in a stack, so a panel can temporarily be overlaid by
 * another panel (e.g. opening the logs for a task run from the import status
 * panel) without losing its state.
 */
interface OpenSidePanel {
  type: GeneralSidePanelType
  props: Record<string, unknown>
}

const generalSidePanels: GeneralSidePanel[] = [
  {
    type: 'taskOverview',
    icon: 'mdi-clipboard-text-clock',
    component: TaskOverviewSidePanel,
  },
  {
    type: 'importStatus',
    icon: 'mdi-database-import',
    component: ImportStatusSidePanel,
  },
  {
    type: 'nonCurrentData',
    icon: 'mdi-chart-box-multiple',
    component: NonCurrentDataSidePanel,
  },
  {
    type: 'runTask',
    icon: 'mdi-cog-play',
    component: RunTasksSidePanel,
  },
  {
    type: 'logDisplay',
    icon: 'mdi-message-text-clock',
    component: LogSidePanel,
  },
  {
    type: 'documentFile',
    icon: 'mdi-information-outline',
    component: MoreInfoSidePanel,
  },
  {
    type: 'share',
    icon: 'mdi-share-variant',
    component: ShareSidePanel,
  },
]

const enabledGeneralSidePanels = computed<GeneralSidePanel[]>(() => {
  const sidePanelConfig = configStore.general.sidePanel

  // FIXME: For now we always enable share, should be removed once SidePanel configuration is implemented for it.
  return generalSidePanels.filter(
    (sidePanel) =>
      sidePanel.type === 'share' || sidePanelConfig?.[sidePanel.type]?.enabled,
  )
})

const hasMultipleEnabledSidePanels = computed<boolean>(
  () => enabledGeneralSidePanels.value.length > 1,
)

const logDisplayId = computed(() => {
  const sidePanelConfig = configStore.general.sidePanel
  return sidePanelConfig?.logDisplay?.logDisplayId
})
const { logDisplay } = useLogDisplay(logDisplayId)

// Stack of open general side panels; the last entry is the visible one. An
// empty stack means no general side panel is open.
const panelStack = ref<OpenSidePanel[]>([])
const activePanel = computed<OpenSidePanel | null>(
  () => panelStack.value.at(-1) ?? null,
)
// The type of the side panel that was opened from the toolbar; panels overlaid
// on top of it do not change the toolbar state.
const openPanelType = computed<GeneralSidePanelType | null>(
  () => panelStack.value[0]?.type ?? null,
)

// Only one "general" side panel is shown in the top bar at all times. "Special"
// side panels (e.g. thresholds) have their own permanent button.
const selectedSidePanelType = ref<GeneralSidePanelType | null>(
  enabledGeneralSidePanels.value[0]?.type ?? null,
)
const menuSidePanel = computed<GeneralSidePanel | null>(
  () => findSidePanel(selectedSidePanelType.value) ?? null,
)

// Thresholds is a "special" side panel with its own button and component; it
// cannot be part of the stack.
const isThresholdsOpen = ref(false)

function findSidePanel(
  type: GeneralSidePanelType | null,
): GeneralSidePanel | undefined {
  if (type === null) return undefined
  return enabledGeneralSidePanels.value.find(
    (sidePanel) => sidePanel.type === type,
  )
}

function getComponentForSidePanel(
  type: GeneralSidePanelType,
): Component | undefined {
  return findSidePanel(type)?.component
}

function getTitleForSidePanel(type: GeneralSidePanelType): string {
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

/**
 * Opens a side panel as the only panel, replacing any panels that are open.
 */
function openSidePanel(
  type: GeneralSidePanelType,
  props: Record<string, unknown> = {},
): void {
  if (!findSidePanel(type)) return

  isThresholdsOpen.value = false
  selectedSidePanelType.value = type
  panelStack.value = [{ type, props }]
}

/**
 * Opens a side panel on top of the currently open panel, which keeps its state
 * and can be returned to with the back button.
 */
function pushSidePanel(
  type: GeneralSidePanelType,
  props: Record<string, unknown> = {},
): void {
  if (!findSidePanel(type)) return

  if (panelStack.value.length === 0) {
    openSidePanel(type, props)
    return
  }

  if (activePanel.value?.type === type) {
    // Do not stack the same panel twice; update its props instead.
    panelStack.value.splice(panelStack.value.length - 1, 1, { type, props })
    return
  }

  panelStack.value.push({ type, props })
}

/**
 * Closes the top-most panel and returns to the panel below it, if any.
 */
function popSidePanel(): void {
  panelStack.value.pop()
}

function closeSidePanel(): void {
  panelStack.value = []
}

function toggleSidePanel(type: GeneralSidePanelType): void {
  if (openPanelType.value === type) {
    closeSidePanel()
  } else {
    openSidePanel(type)
  }
}

function toggleThresholdsSidePanel(): void {
  isThresholdsOpen.value = !isThresholdsOpen.value
  if (isThresholdsOpen.value) closeSidePanel()
}

function openLogTaskRunSidePanel(taskRunId: string): void {
  pushSidePanel('logDisplay', { taskRunId })
}
</script>
