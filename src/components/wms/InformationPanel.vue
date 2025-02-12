<template>
  <ControlChip>
    <v-btn @click="showLayer = !showLayer" density="compact" icon>
      <v-icon>{{ showLayer ? 'mdi-layers' : 'mdi-layers-off' }}</v-icon>
    </v-btn>
    <v-menu
      transition="slide-y-transition"
      :close-on-content-click="false"
      v-if="showLayer"
    >
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="pe-0 text-none">
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
        <v-list-item prepend-icon="mdi-palette" v-if="currentScales">
          <v-list-item
            v-for="(item, index) of currentScales"
            :key="index"
            @click="currentColourScaleIndex = index"
            class="px-0"
          >
            <v-list-item-title>
              {{ item.style.title }}
            </v-list-item-title>
            <div class="d-flex align-center ga-1">
              <template v-if="item.useGradients !== false">
                <span class="mb-1">{{ item.range?.min ?? '' }}</span>
                <ColourStrip
                  :colourMap="item.colourMap"
                  :useGradients="item.useGradients"
                />
                <span class="mb-1">{{ item.range?.max ?? '' }}</span>
              </template>
              <template v-else>
                <ColourLegendTable :colourMap="item.colourMap" />
              </template>
            </div>
            <template #append v-if="index === currentColourScaleIndex">
              <v-icon>mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list-item>
        <v-list-item v-if="currentScale?.useGradients !== false">
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
                @keydown.enter.stop="changeCurrentColourScaleRange"
                @blur="changeCurrentColourScaleRange"
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
                @keydown.enter.stop="changeCurrentColourScaleRange"
                @blur="changeCurrentColourScaleRange"
                :rules="[rules.required, rules.biggerThanMin]"
              ></v-text-field>
            </v-col>
            <v-col cols="2" class="d-flex align-center justify-center">
              <v-btn
                v-if="!currentScaleIsInitialRange"
                icon="mdi-restore"
                variant="flat"
                density="compact"
                @click="resetCurrentScaleRange"
              />
            </v-col>
          </v-row>
        </v-list-item>
        <v-list-item v-if="canUseStreamlines" prepend-icon="mdi-animation-play">
          <v-list-item-title>Animate</v-list-item-title>
          <template v-slot:append>
            <v-switch
              density="compact"
              v-model="doAnimateStreamlines"
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
      :color="doAnimateStreamlines ? 'primary' : undefined"
    >
      <v-progress-circular v-if="isLoading" size="20" indeterminate />
      <v-icon v-else>mdi-animation-play</v-icon>
    </v-btn>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { DateTime } from 'luxon'
import { ref } from 'vue'
import { LayerKind } from '@/lib/streamlines'
import ColourStrip from '@/components/wms/ColourStrip.vue'
import { watch } from 'vue'
import { useColourScalesStore, type Range } from '@/stores/colourScales'
import ColourLegendTable from './ColourLegendTable.vue'
import ControlChip from '@/components/wms/ControlChip.vue'
import { useColourScales } from '@/services/useColourScales'
import { useUserSettingsStore } from '@/stores/userSettings'

interface Props {
  layerTitle?: string
  isLoading: boolean
  currentTime?: Date
  forecastTime?: Date
  completelyMissing?: boolean
  firstValueTime?: Date
  lastValueTime?: Date
  canUseStreamlines?: boolean
  currentColourScaleIds: string[]
}

const userSettingsStore = useUserSettingsStore()

const props = withDefaults(defineProps<Props>(), {
  layerTitle: '',
  completelyMissing: false,
})
const showLayer = defineModel<boolean>('showLayer')
const layerKind = defineModel<LayerKind>('layerKind', { required: true })

const emit = defineEmits(['update:layerKind', 'update:current-colour-scale'])

const doAnimateStreamlines = computed<boolean>({
  get: () => layerKind.value === LayerKind.Streamline,
  set: (doAnimate) => {
    layerKind.value = doAnimate ? LayerKind.Streamline : LayerKind.Static
  },
})

const currentColourScaleIndex = ref(0)
watch(
  () => props.currentColourScaleIds,
  () => {
    currentColourScaleIndex.value = 0
  },
)

const colourScalesStore = useColourScalesStore()
const {
  currentScale,
  currentScales,
  currentScaleIsInitialRange,
  resetCurrentScaleRange,
} = useColourScales(
  currentColourScaleIndex,
  () => props.currentColourScaleIds,
  () => colourScalesStore.scales,
)

watch(
  currentScale,
  () => {
    emit('update:current-colour-scale', currentScale.value)
  },
  { immediate: true },
)

const mutableColorScaleRange = ref<Range>()
watch(
  () => currentScale.value?.range,
  () => {
    mutableColorScaleRange.value = currentScale.value?.range
      ? { ...currentScale.value?.range }
      : undefined
  },
  { immediate: true, deep: true },
)

const changeCurrentColourScaleRange = () => {
  if (mutableColorScaleRange.value === undefined) return
  if (currentScale.value === undefined) return

  currentScale.value.range = mutableColorScaleRange.value
}

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
  if (!props.forecastTime) return undefined

  if (isNaN(props.forecastTime.getTime())) {
    return 'Analysis time not available'
  }

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
