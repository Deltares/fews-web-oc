<template>
  <v-list-item prepend-icon="mdi-palette" v-if="currentScales" class="pe-1">
    <v-list max-height="130">
      <v-list-item
        v-for="(item, index) of currentScales"
        :key="index"
        @click="currentColourScaleIndex = index"
        class="ps-0"
        :title="item.style.title"
      >
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
    </v-list>
    <template v-if="currentScale?.useGradients !== false">
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
            aria-label="Reset current colour scale range"
            @click="resetCurrentScaleRange"
          />
        </v-col>
      </v-row>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import ColourStrip from '@/components/wms/ColourStrip.vue'
import ColourLegendTable from '@/components/wms/ColourLegendTable.vue'
import { useColourScalesStore, type Range } from '@/stores/colourScales'
import { useColourScales } from '@/services/useColourScales'
import { ref, watch } from 'vue'

interface Props {
  currentColourScaleIds: string[]
}

const props = defineProps<Props>()

const currentColourScaleIndex = defineModel<number>('currentColourScaleIndex', {
  required: true,
})
watch(
  () => props.currentColourScaleIds,
  () => {
    currentColourScaleIndex.value = 0
  },
)

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

const colourScalesStore = useColourScalesStore()
const {
  currentScale,
  currentScales,
  currentScaleIsInitialRange,
  resetCurrentScaleRange,
} = useColourScales(
  currentColourScaleIndex,
  () => props.currentColourScaleIds,
  colourScalesStore.scales,
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
</script>

<style scoped>
.scales-container {
  max-height: 300px;
  overflow-y: auto;
}
</style>
