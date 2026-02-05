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
        <v-list-item
          :title="title"
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
      </v-list>
    </v-menu>

    <slot v-if="showLayer" name="chip-append" />

    <template #extension v-if="showLayer">
      <slot name="extension" />
    </template>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ControlChip from '@/components/wms/ControlChip.vue'
import type { Layer } from '@deltares/fews-wms-requests'
import { useI18n } from 'vue-i18n'
import {
  getForecastTimeString,
  getValueTimeRangeString,
} from '@/lib/capabilities'

const { t } = useI18n()

interface Props {
  isLoading: boolean
  currentTime?: Date
  layerCapabilities?: Layer
}

const props = defineProps<Props>()
const showLayer = defineModel<boolean>('showLayer')

const emit = defineEmits(['style-click'])

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
</script>
