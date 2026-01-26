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
            :class="{ 'text-decoration-line-through': props.completelyMissing }"
            >{{ layerTitle }}</span
          >
        </v-btn>
      </template>
      <v-list class="information-panel-list">
        <v-list-item
          :title="props.layerTitle"
          :subtitle="analysisTime"
          prepend-icon="mdi-layers"
        >
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          :title="t('wms.timeRange')"
          :subtitle="formattedTimeRange"
          prepend-icon="mdi-clock-time-four-outline"
        >
        </v-list-item>

        <slot></slot>

        <v-list-item v-if="canUseStreamlines" prepend-icon="mdi-animation-play">
          <v-list-item-title>Animate</v-list-item-title>
          <template v-slot:append>
            <v-switch
              v-model="doAnimateStreamlines"
              color="primary"
              density="compact"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn
      v-if="showLayer && canUseStreamlines"
      @click="toggleLayerType"
      icon
      density="compact"
      variant="plain"
      :color="doAnimateStreamlines ? 'primary' : undefined"
    >
      <v-progress-circular v-if="isLoading" size="20" indeterminate />
      <v-icon v-else>mdi-animation-play</v-icon>
    </v-btn>
    <template
      #extension
      v-if="showLayer && doShowAggregated && aggregations.length > 0"
    >
      <v-btn-toggle
        v-model="selectedAggregationLabel"
        density="compact"
        variant="flat"
        mandatory
        class="overflow-visible"
      >
        <v-tooltip v-for="item in aggregations" :key="item.id" location="top">
          <template #activator="{ props: tooltipProps }">
            <AggregationButton
              :item="item"
              :selectedAggregationLabel="selectedAggregationLabel"
              :tooltipProps="tooltipProps"
            />
          </template>
          <b>{{ item.type }} {{ item.id }}</b>
          <p>{{ toDateRangeString(item.startDate, item.endDate) }}</p>
        </v-tooltip>
      </v-btn-toggle>
    </template>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { LayerKind } from '@/lib/streamlines'
import AggregationButton from '@/components/wms/panel/AggregationButton.vue'
import ControlChip from '@/components/wms/ControlChip.vue'
import { useUserSettingsStore } from '@/stores/userSettings'
import { toDateRangeString, toHumanReadableDateTime } from '@/lib/date'
import { AggregationItem } from '@/lib/aggregation'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  layerTitle?: string
  isLoading: boolean
  currentTime?: Date
  forecastTime?: Date
  completelyMissing?: boolean
  firstValueTime?: Date
  lastValueTime?: Date
  canUseStreamlines?: boolean
  aggregations: AggregationItem[]
}

const userSettingsStore = useUserSettingsStore()

const props = withDefaults(defineProps<Props>(), {
  layerTitle: '',
  completelyMissing: false,
})
const showLayer = defineModel<boolean>('showLayer')
const layerKind = defineModel<LayerKind>('layerKind', { required: true })
const selectedAggregationLabel = defineModel<string | null>(
  'selectedAggregationLabel',
  { required: true },
)
const doShowAggregated = defineModel<boolean>('doShowAggregated', {
  required: true,
})

const emit = defineEmits(['style-click'])

const doAnimateStreamlines = computed<boolean>({
  get: () => layerKind.value === LayerKind.Streamline,
  set: (doAnimate) => {
    layerKind.value = doAnimate ? LayerKind.Streamline : LayerKind.Static
  },
})

const analysisTime = computed(() => {
  if (!props.forecastTime) return undefined

  if (isNaN(props.forecastTime.getTime())) {
    return 'Analysis time not available'
  }

  return `Analysis time: ${toHumanReadableDateTime(props.forecastTime)}`
})

const formattedTimeRange = computed(() => {
  if (props.completelyMissing) return 'Currently no data available'
  return toDateRangeString(props.firstValueTime, props.lastValueTime)
})

function toggleLayerType(): void {
  doAnimateStreamlines.value = !doAnimateStreamlines.value

  // If we are in this function, the user manually selected a layer kind, so
  // store their preference. Wait for the layerkind to update based on the
  // change in the doAnimateStreamlines boolean, then store the newly updated
  // layerKind.
  nextTick(() => {
    userSettingsStore.preferredLayerKind = layerKind.value
  })
}
</script>

<style scoped>
#toggle {
  display: flex;
  justify-content: center;
}

.information-panel__tab {
  padding: 5px 10px;
  background-color: rgba(var(--v-theme-surface), 0.8);
  cursor: pointer;
  display: none; /* hidden */
}

.information-panel__tab.active {
  border-radius: 3px;
  display: inherit; /* visible */
}
</style>
