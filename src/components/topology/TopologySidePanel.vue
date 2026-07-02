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
      <v-icon :icon="currentGeneralSidePanel.icon"></v-icon>
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
          v-for="generalSidePanel in enabledGeneralSidePanels"
          :key="generalSidePanel.type"
          :prepend-icon="generalSidePanel.icon"
          :title="t(`sidePanel.${generalSidePanel.type}`)"
          :active="activeSidePanelType === generalSidePanel.type"
          @click="setCurrentGeneralSidePanel(generalSidePanel)"
        />
      </v-list>
    </v-menu>
  </BtnGroup>

  <template v-for="sidePanel in enabledGeneralSidePanels" :key="sidePanel.type">
    <component
      v-if="activeSidePanelType === sidePanel.type"
      :is="sidePanel.component"
      :topology-node="topologyNode"
      v-bind="
        sidePanel.type === 'logDisplay' ? { settings: settingsForSidePanel() } : {}
      "
      @close="closeSidePanel()"
    />
  </template>

  <ThresholdsSidePanel
    v-if="activeSidePanelType === 'thresholds'"
    :topologyNode="topologyNode"
    :locationIds="locationIds"
    @close="toggleActiveSidePanel('thresholds')"
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

import ImportStatusSidePanel from '@/components/sidepanel/ImportStatusSidePanel.vue'
import LogSidePanel from '@/components/sidepanel/LogSidePanel.vue'
import MoreInfoSidePanel from '@/components/sidepanel/MoreInfoSidePanel.vue'
import NonCurrentDataSidePanel from '@/components/sidepanel/NonCurrentDataSidePanel.vue'
import RunTasksSidePanel from '@/components/sidepanel/RunTasksSidePanel.vue'
import ShareSidePanel from '@/components/sidepanel/ShareSidePanel.vue'
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

// FIXME: Remove 'share' once SidePanel configuration is implemented for it.
type GeneralSidePanelType = Exclude<
  keyof SidePanelConfig | 'share',
  'exportStatus'
>
type SpecialSidePanelType = 'thresholds'
type SidePanelType = GeneralSidePanelType | SpecialSidePanelType

interface GeneralSidePanel {
  type: GeneralSidePanelType
  icon: string
  component: Component
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

function settingsForSidePanel(): { logDisplayId: string } {
  const sidePanelConfig = configStore.general.sidePanel
  return { logDisplayId: sidePanelConfig?.logDisplay?.logDisplayId ?? '' }
}

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
