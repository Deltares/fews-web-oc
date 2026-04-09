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
      v-if="showLayer"
    >
      <template v-slot:activator="{ props, isActive }">
        <v-btn
          variant="text"
          v-bind="props"
          class="text-none"
          aria-label="Layer information"
        >
          <span :class="{ 'text-decoration-line-through': completelyMissing }">
            {{ title }}
          </span>
          <slot name="chip-append-inner"></slot>
          <template #append>
            <SelectIcon :active="isActive" />
          </template>
        </v-btn>
      </template>
      <v-list class="information-panel-list">
        <v-list-item prepend-icon="mdi-layers">
          <v-list-item-subtitle>{{
            t('wms.selectLayers')
          }}</v-list-item-subtitle>
          <v-list-item-title>{{ layers[0]?.groupTitle }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-for="layerOption in layers"
          :key="layerOption?.name"
          :title="layerOption?.title"
          :active="layerOption?.name === props.layerName"
          @click="updateLayer(layerOption?.name)"
          density="compact"
          ><template #prepend>
            <v-icon class="ps-6" size="x-small">{{
              layerOption?.name === props.layerName
                ? 'mdi-radiobox-marked'
                : 'mdi-radiobox-blank'
            }}</v-icon>
          </template>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-clock-time-four-outline">
          <v-list-item-title>
            <span class="text-medium-emphasis">T0:</span>
            {{ analysisTime }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ formattedTimeRange }}
          </v-list-item-subtitle>
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
import SelectIcon from '@/components/general/SelectIcon.vue'
import type { Layer } from '@deltares/fews-wms-requests'
import { useI18n } from 'vue-i18n'
import {
  fetchWmsCapabilitiesHeaders,
  getForecastTimeString,
  getValueTimeRangeString,
} from '@/lib/capabilities'

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
</script>
