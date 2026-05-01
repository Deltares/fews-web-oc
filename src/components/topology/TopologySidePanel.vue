<template>
  <BtnGroup class="me-2">
    <template #persistent v-if="showActiveThresholdCrossingsForFilters">
      <ThresholdsButton
        :active="activeSidePanelType === 'thresholds'"
        @click="toggleActiveSidePanel('thresholds')"
      />
    </template>

    <v-btn
      v-if="currentGeneralSidePanel !== null"
      :active="activeSidePanelType === currentGeneralSidePanel.type"
      size="small"
      icon
      @click="toggleActiveSidePanel(currentGeneralSidePanel.type)"
    >
      <v-icon :icon="currentGeneralSidePanel.icon" size="large"></v-icon>
    </v-btn>

    <v-menu v-if="hasMultipleEnabledSidePanels" location="bottom right">
      <template #activator="{ isActive, props }">
        <v-btn
          icon
          v-bind="props"
          aria-label="More Sidepanel Options"
          size="small"
        >
          <v-icon
            :icon="isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="large"
          />
        </v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="generalSidePanel in enabledGeneralSidePanels"
          :key="generalSidePanel.type"
          :prepend-icon="generalSidePanel.icon"
          :title="generalSidePanel.title"
          :active="activeSidePanelType === generalSidePanel.type"
          @click="setCurrentGeneralSidePanel(generalSidePanel)"
        />
      </v-list>
    </v-menu>
  </BtnGroup>

  <template v-for="sidePanel in enabledGeneralSidePanels" :key="sidePanel.type">
    <component
      :is="sidePanel.component"
      :is-active="activeSidePanelType === sidePanel.type"
      :topology-node="topologyNode"
      @close="closeSidePanel()"
    />
  </template>

  <ThresholdsSidePanel
    v-if="showActiveThresholdCrossingsForFilters"
    :isActive="activeSidePanelType === 'thresholds'"
    :topologyNode="topologyNode"
    :locationIds="locationIds"
    @close="toggleActiveSidePanel('thresholds')"
    @navigate="emit('navigate', $event)"
  />
</template>

<script setup lang="ts">
import { TopologyNode } from '@deltares/fews-pi-requests'
import { type Component, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { NavigateRoute } from '@/lib/router'

import { useConfigStore } from '@/stores/config'

import BtnGroup from '@/components/general/BtnGroup.vue'
import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'

import ImportStatusSidePanel from '@/components/sidepanel/ImportStatusSidePanel.vue'
import MoreInfoSidePanel from '@/components/sidepanel/MoreInfoSidePanel.vue'
import NonCurrentDataSidePanel from '@/components/sidepanel/NonCurrentDataSidePanel.vue'
import RunTasksSidePanel from '@/components/sidepanel/RunTasksSidePanel.vue'
import TaskOverviewSidePanel from '@/components/sidepanel/TaskOverviewSidePanel.vue'
import ThresholdsSidePanel from '@/components/sidepanel/ThresholdsSidePanel.vue'

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

type GeneralSidePanelType =
  | 'tasks'
  | 'info'
  | 'workflows'
  | 'visualize'
  | 'import'
type SpecialSidePanelType = 'thresholds'
type SidePanelType = GeneralSidePanelType | SpecialSidePanelType

interface GeneralSidePanel {
  type: GeneralSidePanelType
  title: string
  icon: string
  component: Component
}

const enabledGeneralSidePanels = computed<GeneralSidePanel[]>(() => {
  const sidePanelConfig = configStore.general.sidePanel
  const sidePanels: GeneralSidePanel[] = []

  if (sidePanelConfig?.taskOverview?.enabled) {
    sidePanels.push({
      type: 'tasks',
      title: t('sidePanel.taskOverview'),
      icon: 'mdi-clipboard-text-clock',
      component: TaskOverviewSidePanel,
    })
  }
  if (sidePanelConfig?.importStatus?.enabled) {
    sidePanels.push({
      type: 'import',
      title: t('sidePanel.importStatus'),
      icon: 'mdi-database-import',
      component: ImportStatusSidePanel,
    })
  }
  if (sidePanelConfig?.nonCurrentData?.enabled) {
    sidePanels.push({
      type: 'visualize',
      title: t('sidePanel.noncurrentData'),
      icon: 'mdi-chart-box-multiple',
      component: NonCurrentDataSidePanel,
    })
  }
  if (sidePanelConfig?.runTask?.enabled) {
    sidePanels.push({
      type: 'workflows',
      title: t('sidePanel.runTasks'),
      icon: 'mdi-cog-play',
      component: RunTasksSidePanel,
    })
  }
  if (sidePanelConfig?.documentFile?.enabled) {
    sidePanels.push({
      type: 'info',
      title: t('sidePanel.moreInfo'),
      icon: 'mdi-information-outline',
      component: MoreInfoSidePanel,
    })
  }

  return sidePanels
})
const hasMultipleEnabledSidePanels = computed<boolean>(
  () => enabledGeneralSidePanels.value.length > 1,
)
// Only one "general" side panel is shown in the top bar at all times. "Special"
// side panels (e.g. thresholds) have their own permanent button.
const currentGeneralSidePanel = ref<GeneralSidePanel | null>(
  enabledGeneralSidePanels.value[0] ?? null,
)
// There can be only one active side panel, special or general, at a time.
const activeSidePanelType = ref<SidePanelType | null>(null)

function setCurrentGeneralSidePanel(sidePanel: GeneralSidePanel): void {
  currentGeneralSidePanel.value = sidePanel
  activeSidePanelType.value = sidePanel.type
}

function closeSidePanel(): void {
  activeSidePanelType.value = null
}

function toggleActiveSidePanel(type: SidePanelType): void {
  activeSidePanelType.value = activeSidePanelType.value === type ? null : type
}
</script>
