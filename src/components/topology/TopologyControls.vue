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

  <SidePanelContent
    v-for="sidePanel in enabledGeneralSidePanels"
    :key="sidePanel.type"
    :title="sidePanel.title"
    :isActive="activeSidePanelType === sidePanel.type"
    @close="closeSidePanel()"
  >
    <component :is="sidePanel.component" :topologyNode="topologyNode" />
  </SidePanelContent>
  <SidePanelContent
    :title="t('sidePanel.thresholdOverview')"
    :isActive="activeSidePanelType === 'thresholds'"
    @close="toggleActiveSidePanel('thresholds')"
  >
    <ThresholdsOverview
      :topologyNode="topologyNode"
      :locationIds="locationIds"
      @close="closeSidePanel()"
      @navigate="emit('navigate', $event)"
    />
  </SidePanelContent>
</template>

<script setup lang="ts">
import SidePanelContent from '@/components/sidepanel/SidePanelContent.vue'
import ThresholdsOverview from '@/components/thresholds/ThresholdsOverview.vue'
import InformationDisplayView from '@/views/InformationDisplayView.vue'
import TaskRunsOverview from '@/components/tasks/TaskRunsOverview.vue'
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'
import VisualizeDataControl from '@/components/tasks/VisualizeDataControl.vue'
import WorkflowsControl from '@/components/workflows/WorkflowsControl.vue'
import BtnGroup from '@/components/general/BtnGroup.vue'
import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'

import { useI18n } from 'vue-i18n'
import { type Component, computed, ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { NavigateRoute } from '@/lib/router'

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
  enabled: boolean
}

const generalSidePanels = computed<GeneralSidePanel[]>(() => {
  const sidePanelConfig = configStore.general.sidePanel
  return [
    {
      type: 'tasks',
      title: t('sidePanel.taskOverview'),
      icon: 'mdi-clipboard-text-clock',
      component: TaskRunsOverview,
      enabled: !!sidePanelConfig?.taskOverview?.enabled,
    },
    {
      type: 'import',
      title: t('sidePanel.importStatus'),
      icon: 'mdi-database-import',
      component: ImportStatusControl,
      enabled: !!sidePanelConfig?.importStatus?.enabled,
    },
    {
      type: 'visualize',
      title: t('sidePanel.noncurrentData'),
      icon: 'mdi-chart-box-multiple',
      component: VisualizeDataControl,
      enabled: !!sidePanelConfig?.nonCurrentData?.enabled,
    },
    {
      type: 'workflows',
      title: t('sidePanel.runTasks'),
      icon: 'mdi-cog-play',
      component: WorkflowsControl,
      enabled: !!sidePanelConfig?.runTask?.enabled,
    },
    {
      type: 'info',
      title: t('sidePanel.moreInfo'),
      icon: 'mdi-information-outline',
      component: InformationDisplayView,
      enabled: !!sidePanelConfig?.documentFile?.enabled,
    },
  ]
})
const enabledGeneralSidePanels = computed<GeneralSidePanel[]>(() =>
  generalSidePanels.value.filter((c) => c.enabled),
)
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
