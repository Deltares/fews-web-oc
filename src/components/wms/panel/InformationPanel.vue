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
    <template #extension v-if="showLayer">
      <slot name="extension" />
    </template>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { LayerKind } from '@/lib/streamlines'
import ControlChip from '@/components/wms/ControlChip.vue'
import { useUserSettingsStore } from '@/stores/userSettings'
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
  canUseStreamlines?: boolean
}

const userSettingsStore = useUserSettingsStore()

const props = defineProps<Props>()
const showLayer = defineModel<boolean>('showLayer')
const layerKind = defineModel<LayerKind>('layerKind', { required: true })

const emit = defineEmits(['style-click'])

const doAnimateStreamlines = computed<boolean>({
  get: () => layerKind.value === LayerKind.Streamline,
  set: (doAnimate) => {
    layerKind.value = doAnimate ? LayerKind.Streamline : LayerKind.Static
  },
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
</style>
