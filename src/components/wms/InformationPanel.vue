<template>
  <v-chip v-bind="props" pill label class="info-panel" id="info-panel">
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
        <v-btn variant="plain" v-bind="props" class="pe-0 text-capitalize">
          <span
            class="me-2"
            :class="{ 'text-decoration-line-through': props.completelyMissing }"
            >{{ layerTitle }}</span
          >
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          :title="props.layerTitle"
          :subtitle="analysisTime"
          prepend-icon="mdi-layers"
        >
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          :title="'Time range'"
          :subtitle="formattedTimeRange"
          prepend-icon="mdi-clock-time-four-outline"
        >
        </v-list-item>
        <v-list-item
          prepend-icon="mdi-palette"
          v-if="colourScalesStore.currentScales"
        >
          <v-list-item
            v-for="(item, index) of colourScalesStore.currentScales"
            :key="index"
            @click="colourScalesStore.currentIndex = index"
          >
            <v-list-item-title>
              {{ item.style.title }}
            </v-list-item-title>
            <div class="d-flex align-center ga-1">
              <span class="mb-1">{{ item.range?.min ?? '' }}</span>
              <ColourStrip :colourMap="item.colourMap" />
              <span class="mb-1">{{ item.range?.max ?? '' }}</span>
            </div>
            <template #append v-if="index === colourScalesStore.currentIndex">
              <v-icon>mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list-item>
        <v-list-item>
          <template v-slot:prepend>
            <div class="mx-7"></div>
          </template>
          <v-row v-if="mutableColorScaleRange">
            <v-col cols="5">
              <v-text-field
                v-model.number="mutableColorScaleRange.min"
                label="Min"
                variant="plain"
                hide-details
                density="comfortable"
                @keydown.enter.stop="changecolorScaleRange"
                @blur="changecolorScaleRange"
                :rules="[rules.required, rules.smallerThanMax]"
              ></v-text-field>
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model.number="mutableColorScaleRange.max"
                label="Max"
                variant="plain"
                hide-details
                density="comfortable"
                @keydown.enter.stop="changecolorScaleRange"
                @blur="changecolorScaleRange"
                :rules="[rules.required, rules.biggerThanMin]"
              ></v-text-field>
            </v-col>
            <v-col cols="2" class="d-flex align-center justify-center">
              <v-btn
                v-if="!colourScalesStore.currentScaleIsInitialRange"
                icon="mdi-restore"
                variant="flat"
                density="compact"
                @click="colourScalesStore.resetCurrentScaleRange"
              />
            </v-col>
          </v-row>
        </v-list-item>
        <v-list-item v-if="canUseStreamlines" prepend-icon="mdi-animation-play">
          <v-list-item-title>Animate</v-list-item-title>
          <template v-slot:append>
            <v-switch
              density="compact"
              v-model="animate"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn
      v-if="showLayer && canUseStreamlines"
      @click="switchLayerType"
      icon
      density="compact"
      variant="plain"
      :color="animate ? 'primary' : undefined"
    >
      <v-icon>mdi-animation-play</v-icon>
    </v-btn>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { ref } from 'vue'
import { LayerKind } from '@/lib/streamlines'
import ColourStrip from '@/components/wms/ColourStrip.vue'
import { watch } from 'vue'
import { useColourScalesStore } from '@/stores/colourScales'

interface Props {
  layerTitle: string
  currentTime?: Date
  forecastTime?: Date
  completelyMissing?: boolean
  firstValueTime?: Date
  lastValueTime?: Date
  canUseStreamlines?: boolean
}

const colourScalesStore = useColourScalesStore()

const props = withDefaults(defineProps<Props>(), {
  layerTitle: '',
  completelyMissing: false,
})

const emit = defineEmits(['style-click', 'update:layerKind'])

const mutableColorScaleRange = ref(
  colourScalesStore.currentScale?.range
    ? { ...colourScalesStore.currentScale?.range }
    : undefined,
)

watch(
  () => colourScalesStore.currentScale?.range,
  () => {
    mutableColorScaleRange.value = colourScalesStore.currentScale?.range
      ? { ...colourScalesStore.currentScale?.range }
      : undefined
  },
  { deep: true },
)

const changecolorScaleRange = () => {
  if (mutableColorScaleRange.value === undefined) return
  colourScalesStore.setCurrentScaleRange(mutableColorScaleRange.value)
}

const showLayer = defineModel<boolean>('showLayer')
const animate = defineModel<boolean>('animate', { default: false })

const rules = {
  required: (v: number) =>
    (v !== null && v !== undefined && String(v) !== '') || 'Field is required',
  biggerThanZero: (v: number) =>
    v >= 0 || 'Value must be bigger or equal than 0',
  smallerThanMax: (v: number) =>
    (mutableColorScaleRange.value && v < mutableColorScaleRange.value.max) ||
    'Value must be smaller than max',
  biggerThanMin: (v: number) =>
    (mutableColorScaleRange.value && v > mutableColorScaleRange.value.min) ||
    'Value must be bigger than min',
}

const analysisTime = computed(() => {
  if (!props.forecastTime || isNaN(props.forecastTime.getTime()))
    return 'Analysis time not available'
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

const switchLayerType = () => {
  animate.value = !animate.value
}

watch(
  () => animate.value,
  () => {
    const value = animate.value ? LayerKind.Streamline : LayerKind.Static
    emit('update:layerKind', value)
  },
)
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
#toggle {
  display: flex;
  justify-content: center;
}
</style>
