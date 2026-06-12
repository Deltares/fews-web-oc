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
          :active="item.id === currentScale?.id"
          @click="selectScale(index)"
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
import { type ColourScale, type Range } from '@/stores/colourScales'
import { computed, ref, watch } from 'vue'

interface Props {
  items: ColourScale[]
}

const props = defineProps<Props>()
const modelValue = defineModel<ColourScale | undefined>()

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

const currentScale = computed(() => modelValue.value)
const currentScales = computed(() => props.items)

const currentScaleIsInitialRange = computed(() => {
  if (!currentScale.value) return false
  return (
    currentScale.value.range.min === currentScale.value.initialRange.min &&
    currentScale.value.range.max === currentScale.value.initialRange.max
  )
})

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

function resetCurrentScaleRange() {
  if (!currentScale.value) return
  currentScale.value.range = currentScale.value.initialRange
}

function selectScale(index: number) {
  modelValue.value = currentScales.value[index]
  showMenu.value = false
}
</script>

<style scoped>
.scales-container {
  max-height: 300px;
  overflow-y: auto;
}
</style>
