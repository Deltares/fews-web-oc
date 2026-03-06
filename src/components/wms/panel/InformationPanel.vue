<template>
  <ControlChip :class="{ 'pe-0': showLayer }">
    <v-btn
      @click="showLayer = !showLayer"
      density="compact"
      variant="plain"
      icon
    >
      <v-icon>{{ showLayer ? 'mdi-layers' : 'mdi-layers-off' }}</v-icon>
    </v-btn>

    <slot v-if="showLayer" name="chip-prepend" />

    <v-menu
      transition="slide-y-transition"
      :close-on-content-click="false"
      :offset="[0, 37]"
    >
      <template v-slot:activator="{ props, isActive }">
        <v-list-item
          v-bind="props"
          variant="text"
          class="text-none ps-1"
          aria-label="Layer information"
        >
          <div class="d-flex ga-2">
            <v-list-item-title class="selected-task-run-title" :class="{ 'text-decoration-line-through': completelyMissing }">
              {{ title }}
            </v-list-item-title>
            <v-icon
              v-if="selectedTaskRun"
              icon="mdi-circle"
              size="sm"
              :color
              :disabled="selectedTaskRun?.isCurrent"
            />
            <v-list-item-subtitle class="selected-task-run-subtitle">
              {{ timeZeroString }}
            </v-list-item-subtitle>
          </div>
          <template #append>
            <SelectIcon :active="isActive" />
          </template>
        </v-list-item>
      </template>
      <v-list class="information-panel-list">
        <v-list-item prepend-icon="mdi-layers">
          <v-list-item v-if="layers.length <= 1" :title="title" class="px-0" />
          <v-menu
            v-else
            v-model="showMenu"
            transition="slide-y-transition"
            :close-on-content-click="false"
          >
            <template v-slot:activator="{ props, isActive }">
              <v-list-item
                v-bind="props"
                :title="title"
                :subtitle="analysisTime"
                rounded
                class="px-0"
              >
                <template #append>
                  <SelectIcon :active="isActive" />
                </template>
              </v-list-item>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="layerOption in layers"
                :key="layerOption?.name"
                :title="layerOption?.title"
                :active="layerOption?.name === layer"
                @click="updateLayer(layerOption?.name)"
              />
            </v-list>
          </v-menu>
        </v-list-item>
        <v-list-item v-if="taskRunId">
          <div class="d-flex flex-row ga-1">
            <v-icon class="clock-icon">mdi-clock-time-four-outline</v-icon>
            <div class="d-flex flex-column flex-1-1">
              <TaskRunControlItem
                v-for="item in currentTaskRuns"
                :key="item.taskId"
                @click="taskRunId = item?.taskId"
                :active="item?.taskId === taskRunId"
                :item="item"
              />
              <TaskRunControlItem
                v-for="item in taskRuns"
                :key="item.taskId"
                :item="item"
                @click="taskRunId = item?.taskId"
                :active="item?.taskId === taskRunId"
              />
            </div>
          </div>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          :subtitle="formattedTimeRange"
          prepend-icon="mdi-clock-start"
        >
        </v-list-item>
        <slot></slot>
      </v-list>
    </v-menu>

    <slot v-if="showLayer" name="chip-append" />

    <template #extension v-if="showLayer">
      <slot name="extension"></slot>
    </template>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ControlChip from '@/components/wms/ControlChip.vue'
import SelectIcon from '@/components/general/SelectIcon.vue'
import TaskRunControlItem from '@/components/wms/TaskRunControlItem.vue'
import type { Layer } from '@deltares/fews-wms-requests'
import {
  fetchWmsCapabilitiesHeaders,
  getForecastTimeString,
  getValueTimeRangeString,
} from '@/lib/capabilities'
import { useTaskRunsStore } from '@/stores/taskRuns'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import { toHumanReadableDateTime } from '@/lib/date'

interface Props {
  layerName?: string
  groupId?: string
  isLoading: boolean
  currentTime?: Date
  layerCapabilities?: Layer
}

const taskRunId = defineModel<string>('taskRunId')
const props = defineProps<Props>()
const showLayer = defineModel<boolean>('showLayer')

const showMenu = ref(false)

interface Emits {
  changeLayer: [string]
}
const emit = defineEmits<Emits>()

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

function updateLayer(newLayerName?: string) {
  layer.value = newLayerName
  showMenu.value = false
}

const taskRunsStore = useTaskRunsStore()
const taskRunColorsStore = useTaskRunColorsStore()

const currentTaskRuns = computed(() => taskRunsStore.currentTaskRuns)
const taskRuns = computed(() => taskRunsStore.sortedSelectedTaskRuns)

const selectedTaskRun = computed(() =>
  taskRunsStore.getTaskRunById(taskRunId.value),
)

const numberOfTaskRuns = computed(() => taskRuns.value.length)

watch(numberOfTaskRuns, (newNumberOfTaskRuns, oldNumberOfTaskRuns) => {
  if (newNumberOfTaskRuns > 0 && oldNumberOfTaskRuns == 0) {
    taskRunId.value = taskRuns.value[0].taskId
  }
})

watch(
  taskRuns,
  (newRuns) => {
    if (
      taskRunId.value &&
      !newRuns.find((taskRun) => taskRun.taskId === taskRunId.value)
    ) {
      taskRunId.value = newRuns[0]?.taskId
    }
  },
  { deep: true },
)

const timeZeroString = computed(() => {
  if (!selectedTaskRun.value) return ''
  return toHumanReadableDateTime(selectedTaskRun.value.timeZeroTimestamp)
})

const color = computed(() => {
  if (!selectedTaskRun.value) return
  return taskRunColorsStore.getColor(selectedTaskRun.value.taskId)
})
</script>

<style scoped>
.selected-task-run-title {
  line-height: 1;
  font-size: 0.875rem;
}

.selected-task-run-subtitle {
  font-size: 0.75rem;
}

.clock-icon {
  margin-top: 4px;
  margin-right: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}
</style>
