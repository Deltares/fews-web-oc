<template>
  <v-list-item
    prepend-icon="mdi-palette"
    v-if="currentScale && currentScales"
    class="pe-1"
  >
    <ColourItem
      v-if="currentScales.length === 1"
      :item="currentScale"
      rounded
      class="px-0"
    />
    <v-menu v-else v-model="showMenu" :close-on-content-click="false">
      <template #activator="{ props, isActive }">
        <ColourItem :item="currentScale" v-bind="props" rounded class="px-0">
          <template #append>
            <SelectIcon :active="isActive" />
          </template>
        </ColourItem>
      </template>

      <v-list density="compact">
        <ColourItem
          v-for="(item, index) in currentScales"
          :item="item"
          :active="index === currentColourScaleIndex"
          @click="updateColourScaleIndex(index)"
        />
      </v-list>
    </v-menu>
    <div
      v-if="mutableColorScaleRange && currentScale.useGradients !== false"
      class="d-flex ga-2 pt-3"
    >
      <v-text-field
        v-model.number="mutableColorScaleRange.min"
        label="Min"
        variant="plain"
        hide-details
        density="compact"
        @keydown.enter.stop="changeCurrentColourScaleRange"
        @blur="changeCurrentColourScaleRange"
        :rules="[rules.required, rules.smallerThanMax]"
      />
      <v-text-field
        v-model.number="mutableColorScaleRange.max"
        label="Max"
        variant="plain"
        hide-details
        density="compact"
        @keydown.enter.stop="changeCurrentColourScaleRange"
        @blur="changeCurrentColourScaleRange"
        :rules="[rules.required, rules.biggerThanMin]"
      />
      <div class="d-flex align-center pe-2">
        <v-btn
          icon="mdi-restore"
          variant="plain"
          density="compact"
          aria-label="Reset current colour scale range"
          :disabled="currentScaleIsInitialRange"
          @click="resetCurrentScaleRange"
        />
      </div>
    </div>
  </v-list-item>
</template>

<script setup lang="ts">
import ColourItem from '@/components/wms/panel/ColourItem.vue'
import SelectIcon from '@/components/general/SelectIcon.vue'
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

const showMenu = ref(false)

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

function updateColourScaleIndex(index: number) {
  currentColourScaleIndex.value = index
  showMenu.value = false
}
</script>

<style scoped>
.scales-container {
  max-height: 300px;
  overflow-y: auto;
}
</style>
