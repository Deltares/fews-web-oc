<template>
  <v-menu transition="slide-y-transition" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-chip v-bind="props" pill label class="info-panel">
        <v-btn
          @click="showLayer = !showLayer"
          density="compact"
          variant="plain"
          icon
        >
          <v-icon>{{ showLayer ? 'mdi-layers' : 'mdi-layers-off' }}</v-icon>
        </v-btn>
        <span class="mx-2" v-if="showLayer">{{ layerTitle }}</span>
        <v-chip density="comfortable" v-if="showLayer">{{
          formattedCurrentTime
        }}</v-chip>
        <v-btn
          v-if="showLayer"
          @click="switchLayerType"
          icon
          density="compact"
          variant="plain"
        >
          <v-icon>{{ animatedVectorsIcon }}</v-icon>
        </v-btn>
      </v-chip>
    </template>
    <v-list v-if="showLayer">
      <v-list-item
        :title="props.layerTitle"
        :subtitle="analysisTime"
        :prepend-icon="layersIcon"
      >
      </v-list-item>
      <v-list-item
        :title="'Time range'"
        :subtitle="formattedTimeRange"
        :prepend-icon="timeIcon"
      >
      </v-list-item>
      <v-list-group>
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Color scales"
            :prepend-icon="colorScalesIcon"
          ></v-list-item>
        </template>
        <v-list-item
          v-for="(style, index) in props.styles"
          :key="index"
          :title="style.title"
          :subtitle="style.name"
          @click="onStyleClick(style)"
          :active="isSelected(style)"
        >
        </v-list-item>
      </v-list-group>
      <v-list-group>
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Color range"
            :prepend-icon="rangeIcon"
          ></v-list-item>
        </template>
        <v-list-item v-if="mutableColorScaleRange">
          <v-row align="center">
            <v-col cols="6">
              <v-text-field
                v-model.number="mutableColorScaleRange.min"
                label="Min"
                outlined
                variant="underlined"
                hide-details
                @keydown.enter.stop="changecolorScaleRange"
                @blur="changecolorScaleRange"
                :rules="[
                  rules.required,
                  rules.biggerThanZero,
                  rules.smallerThanMax,
                ]"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="mutableColorScaleRange.max"
                label="Max"
                outlined
                variant="underlined"
                hide-details
                @keydown.enter.stop="changecolorScaleRange"
                @blur="changecolorScaleRange"
                :rules="[rules.required, rules.biggerThanMin]"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-list-item>
      </v-list-group>
      <v-list-item :prepend-icon="animatedVectorsIcon">
        <v-btn-toggle mandatory divided v-model="layerKind">
          <v-btn
            v-for="item in itemsLayerKind"
            :key="item.id"
            :value="item.id"
            small
          >
            {{ item.name }}
          </v-btn>
        </v-btn-toggle>
      </v-list-item>
      <v-list-item v-if="props.completelyMissing">
        Wms layer is completely missing
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { Style } from '@deltares/fews-wms-requests'
import { ref } from 'vue'
import { LayerKind } from '@/lib/streamlines'

interface Props {
  layerTitle: string
  currentTime?: Date
  forecastTime?: Date
  styles?: Style[]
  completelyMissing?: boolean
  firstValueTime?: Date
  lastValueTime?: Date
  colorScaleRange?: { min: number; max: number }
  canUseStreamlines?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layerTitle: '',
})

const emit = defineEmits(['style-click', 'color-scale-range-change'])
const layersIcon = 'mdi-layers'
const timeIcon = 'mdi-clock-time-four-outline'
const rangeIcon = 'mdi-layers-edit'
const colorScalesIcon = 'mdi-palette'
const selectedStyle = ref<Style>()
const mutableColorScaleRange = ref(props.colorScaleRange)
const layerKind = defineModel('layerKind')
const showLayer = defineModel('showLayer')
const itemsLayerKind = [
  { id: LayerKind.Static, name: 'Static' },
  { id: LayerKind.Streamline, name: 'Animated' },
]

const rules = {
  required: (v: number) =>
    (v !== null && v !== undefined) || 'Field is required',
  biggerThanZero: (v: number) =>
    v >= 0 || 'Value must be bigger or equal than 0',
  smallerThanMax: (v: number) =>
    (mutableColorScaleRange.value && v < mutableColorScaleRange.value.max) ||
    'Value must be smaller than max',
  biggerThanMin: (v: number) =>
    (mutableColorScaleRange.value && v > mutableColorScaleRange.value.min) ||
    'Value must be bigger than min',
}

const animatedVectorsIcon = computed(() => {
  return layerKind.value === LayerKind.Streamline
    ? 'mdi-stop-circle-outline'
    : 'mdi-animation-play'
})

const analysisTime = computed(() => {
  if (!props.forecastTime) return 'Analysis time not available'
  return (
    'Analysis time: ' +
    DateTime.fromJSDate(props.forecastTime).toFormat('dd/MM/yyyy, HH:mm:ss')
  )
})

const formattedTimeRange = computed(() => {
  if (!props.firstValueTime || !props.lastValueTime) return ''
  const format = 'dd/MM/yyyy, HH:mm:ss'
  return `${DateTime.fromJSDate(props.firstValueTime).toFormat(
    format,
  )} → ${DateTime.fromJSDate(props.lastValueTime).toFormat(format)}`
})
const formattedCurrentTime = computed(() => {
  if (!props.currentTime) return ''
  const format = 'HH:mm ZZZZ'
  const timeZone = 'Europe/Amsterdam'
  const dateTime = DateTime.fromJSDate(props.currentTime)
    .setZone(timeZone)
    .setLocale('nl-NL')
  return dateTime.toFormat(format)
})

const onStyleClick = (style: Style) => {
  selectedStyle.value = style
  emit('style-click', style)
}

const changecolorScaleRange = () => {
  emit('color-scale-range-change', mutableColorScaleRange.value)
}

const isSelected = (style: Style) => {
  return (
    selectedStyle.value !== undefined &&
    selectedStyle.value.title === style.title
  )
}

const switchLayerType = () => {
  layerKind.value =
    layerKind.value === LayerKind.Static
      ? LayerKind.Streamline
      : LayerKind.Static
}
</script>

<style scoped>
.info-panel {
  font-size: 0.825em;
  z-index: 1000;
  border-radius: 5px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.info-icon {
  margin-right: 8px;
  margin-left: 8px;
}
.layer-title {
  font-weight: bold;
}
.current-time {
  margin-left: 10px;
  padding: 0 10px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
}
</style>
