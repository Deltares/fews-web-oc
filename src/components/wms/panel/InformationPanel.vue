<template>
  <ControlChip>
    <v-btn
      @click="showLayer = !showLayer"
      density="compact"
      variant="plain"
      icon
    >
      <v-icon>{{ showLayer ? 'mdi-layers' : 'mdi-layers-off' }}</v-icon>
    </v-btn>
    <v-menu
      transition="slide-y-transition"
      :close-on-content-click="false"
      v-if="showLayer"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          variant="plain"
          v-bind="props"
          class="pe-0 text-none"
          aria-label="Layer information"
        >
          <span
            class="me-2"
            :class="{ 'text-decoration-line-through': completelyMissing }"
          >
            {{ title }}
          </span>
        </v-btn>
      </template>
      <v-list class="information-panel-list">
        <v-list-item prepend-icon="mdi-layers">
          <v-select
            v-model="layer"
            :items="layers"
            density="compact"
            item-value="name"
            hide-details
            class="pb-1"
          />
          <v-list-item-subtitle>
            {{ analysisTime }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-chart-box-multiple">
          <v-select
            v-model="taskRunId"
            :items="selectedTaskRuns"
            :item-title="getWorkflowName"
            :item-value="(item) => item.taskId"
            clearable
            density="compact"
            hide-details
            placeholder="Select non-current task"
          >
            <template #item="{ item, props }">
              <v-list-item
                v-bind="props"
                :title="getWorkflowName(item.raw)"
                :subtitle="toHumanReadableDateTime(item.raw.timeZeroTimestamp)"
              />
            </template>
          </v-select>
        </v-list-item>

        <v-divider></v-divider>
        <v-list-item
          :title="t('wms.timeRange')"
          :subtitle="formattedTimeRange"
          prepend-icon="mdi-clock-time-four-outline"
        >
        </v-list-item>

        <slot></slot>
      </v-list>
    </v-menu>

    <slot v-if="showLayer" name="chip-append" />

    <template #extension v-if="showLayer">
      <slot name="extension" />
    </template>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ControlChip from '@/components/wms/ControlChip.vue'
import type { Layer } from '@deltares/fews-wms-requests'
import { useI18n } from 'vue-i18n'
import {
  fetchWmsCapabilitiesHeaders,
  getForecastTimeString,
  getValueTimeRangeString,
} from '@/lib/capabilities'
import { toHumanReadableDateTime } from '@/lib/date'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { useTaskRunsStore } from '@/stores/taskRuns'
import { TaskRun } from '@/lib/taskruns'

const { t } = useI18n()

interface Props {
  layerName?: string
  groupId?: string
  isLoading: boolean
  currentTime?: Date
  layerCapabilities?: Layer
}

const props = defineProps<Props>()
const showLayer = defineModel<boolean>('showLayer')
const taskRunId = defineModel<string>('taskRunId')

interface Emits {
  changeLayer: [string]
}
const emit = defineEmits<Emits>()

const availableWorkflowsStore = useAvailableWorkflowsStore()
const { selectedTaskRuns } = useTaskRunsStore()

watch(selectedTaskRuns, (newRuns) => {
  if (
    taskRunId.value &&
    !newRuns.find((taskRun) => taskRun.taskId === taskRunId.value)
  ) {
    taskRunId.value = undefined
  }
})

const title = computed(() => props.layerCapabilities?.title ?? '')
const completelyMissing = computed(
  () => props.layerCapabilities?.completelyMissing ?? false,
)
const analysisTime = computed(() =>
  getForecastTimeString(props.layerCapabilities),
)
const formattedTimeRange = computed(() =>
  getValueTimeRangeString(props.layerCapabilities),
)

function getWorkflowName(taskRun: TaskRun): string {
  const workflow = availableWorkflowsStore.byId(taskRun.workflowId)
  return workflow ? workflow.name : 'Unknown workflow'
}

const capabilities = await fetchWmsCapabilitiesHeaders()
const layers = computed(() =>
  props.groupId
    ? capabilities.layers.filter((layer) => layer.groupName === props.groupId)
    : [capabilities.layers.find((layer) => layer.name === props.layerName)],
)
const layer = ref(props.layerName)
watch(
  () => props.layerName,
  (newName) => {
    layer.value = newName
  },
)
watch(
  layer,
  (newLayer) => {
    emit('changeLayer', newLayer ?? '')
  },
  { immediate: true },
)
</script>
