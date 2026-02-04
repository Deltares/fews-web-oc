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
          variant="text"
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
          <v-list-item
            v-if="layers.length <= 1"
            :title="title"
            :subtitle="analysisTime"
            class="px-0"
          />
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
