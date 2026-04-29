<template>
  <BtnGroup class="me-2">
    <template v-slot:persistent v-if="showActiveThresholdCrossingsForFilters">
      <ThresholdsControl
        :topologyNode="topologyNode"
        @navigate="emit('navigate', $event)"
        :locationIds="locationIds"
      />
    </template>
    <SidePanelControl
      v-if="activeSecondaryControl"
      :type="activeSecondaryControl.type"
      :title="activeSecondaryControl.title"
      :icon="activeSecondaryControl.icon"
    >
      <component
        :is="activeSecondaryControl.component"
        :topologyNode="topologyNode"
      />
    </SidePanelControl>
    <v-menu location="bottom right" v-if="activeSecondaryControlCount">
      <template #activator="{ isActive, props }">
        <v-btn
          icon
          v-bind="props"
          aria-label="More Sidepanel Options"
          class="last-btn"
          size="small"
          ><v-icon
            :icon="isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="large"
          ></v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="control in secondaryControls.filter((c) => !c.disabled)"
          :prepend-icon="control.icon"
          :title="control.title"
          @click="
            () => {
              activeControl = control.type
              secondaryControl = control.type
              sidePanelStore.setActive(control.type)
            }
          "
        />
      </v-list>
    </v-menu>
  </BtnGroup>
</template>

<script setup lang="ts">
import SidePanelControl from '@/components/sidepanel/SidePanelControl.vue'
import ThresholdsControl from '@/components/thresholds/ThresholdsControl.vue'
import InformationDisplayView from '@/views/InformationDisplayView.vue'
import TaskRunsOverview from '@/components/tasks/TaskRunsOverview.vue'
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'
import VisualizeDataControl from '@/components/tasks/VisualizeDataControl.vue'
import WorkflowsControl from '@/components/workflows/WorkflowsControl.vue'
import BtnGroup from '@/components/general/BtnGroup.vue'
import { useI18n } from 'vue-i18n'
import { SidePanel, useSidePanelStore } from '@/stores/sidePanel'
import { type Component, computed, ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { NavigateRoute } from '@/lib/router'

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

const sidePanelStore = useSidePanelStore()
const configStore = useConfigStore()

const activeControl = ref<SidePanel>('thresholds')

interface SecondaryControl {
  type: SidePanel
  title: string
  icon: string
  component: Component
  disabled?: boolean
}

const secondaryControls = computed<SecondaryControl[]>(() => {
  const sidePanelConfig = configStore.general.sidePanel
  return [
    {
      type: 'tasks',
      title: t('sidePanel.taskOverview'),
      icon: 'mdi-clipboard-text-clock',
      component: TaskRunsOverview,
      disabled: !sidePanelConfig?.taskOverview?.enabled,
    },
    {
      type: 'import',
      title: t('sidePanel.importStatus'),
      icon: 'mdi-database-import',
      component: ImportStatusControl,
      disabled: !sidePanelConfig?.importStatus?.enabled,
    },
    {
      type: 'visualize',
      title: t('sidePanel.noncurrentData'),
      icon: 'mdi-chart-box-multiple',
      component: VisualizeDataControl,
      disabled: !sidePanelConfig?.nonCurrentData?.enabled,
    },
    {
      type: 'workflows',
      title: t('sidePanel.runTasks'),
      icon: 'mdi-cog-play',
      component: WorkflowsControl,
      disabled: !sidePanelConfig?.runTask?.enabled,
    },
    {
      type: 'info',
      title: t('sidePanel.moreInfo'),
      icon: 'mdi-information-outline',
      component: InformationDisplayView,
      disabled: !sidePanelConfig?.documentFile?.enabled,
    },
  ]
})

// For managing which control is active in the button group
const secondaryControl = ref<SidePanel>(
  secondaryControls.value.find((c) => !c.disabled)?.type ?? 'thresholds',
)
const activeSecondaryControl = computed(() =>
  secondaryControls.value.find((s) => s.type === secondaryControl.value),
)
const activeSecondaryControlCount = computed(
  () => secondaryControls.value.filter((s) => !s.disabled).length,
)

// Sync activeControl and secondaryControl with sidePanelStore
watch(
  () => sidePanelStore.activeSidePanel,
  (newPanel) => {
    if (newPanel && newPanel !== 'thresholds') {
      activeControl.value = newPanel
    }
  },
)

// When activeControl changes, update the side panel if needed
watch(activeControl, (newControl) => {
  if (!sidePanelStore.isActive(newControl)) {
    sidePanelStore.setActive(newControl)
  }
})
</script>
