<template>
  <!-- Text input with the same style as TableCellEdit, a number input
       shows spin buttons and Edge may use a comma as decimal separator -->
  <div
    class="number-stepper-field"
    :class="$attrs.class"
    :style="[{ '--number-stepper-field-height': `${height}px` }, rootStyle]"
  >
    <span
      v-if="prefix"
      class="number-stepper-field__prefix"
      aria-hidden="true"
      @click="inputElement?.focus()"
    >
      {{ prefix }}
    </span>
    <input
      ref="inputElement"
      v-model="modelValue"
      v-bind="inputAttrs"
      class="number-stepper-field__input"
      :style="{ width: `${size}ch` }"
      type="text"
      inputmode="decimal"
      @keydown="onKeydown"
    />
    <!-- Prevent mousedown so the input keeps focus -->
    <div class="number-stepper-field__steppers">
      <button
        type="button"
        tabindex="-1"
        :aria-label="incrementLabel"
        @mousedown.prevent
        @click="emit('step', 1)"
      >
        <v-icon icon="mdi-chevron-up" :size="iconSize" />
      </button>
      <button
        type="button"
        tabindex="-1"
        :aria-label="decrementLabel"
        @mousedown.prevent
        @click="emit('step', -1)"
      >
        <v-icon icon="mdi-chevron-down" :size="iconSize" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, type StyleValue } from 'vue'

defineOptions({ inheritAttrs: false })

interface Props {
  incrementLabel?: string
  decrementLabel?: string
  size?: number
  height?: number
  prefix?: string
}
const {
  incrementLabel = 'Increase',
  decrementLabel = 'Decrease',
  size = 6,
  height = 24,
  prefix,
} = defineProps<Props>()

// The steppers share the field height, so scale their icons with it.
const iconSize = computed(() => height / 2)

const modelValue = defineModel<string>({ required: true })
const emit = defineEmits<{ step: [direction: 1 | -1] }>()

const inputElement = ref<HTMLInputElement>()

// Class and style apply to the field, other attributes (e.g. aria-label and
// listeners) to the input.
const attrs = useAttrs()
const rootStyle = computed(() => attrs.style as StyleValue)
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    emit('step', e.key === 'ArrowUp' ? 1 : -1)
  }
}

defineExpose({
  focus: () => inputElement.value?.focus(),
  select: () => inputElement.value?.select(),
})
</script>

<style scoped>
/* Same style as the TableCellEdit inputs */
.number-stepper-field {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  height: var(--number-stepper-field-height);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgb(var(--v-theme-surface));
  transition:
    border-color 120ms ease,
    background-color 120ms ease;
}

.number-stepper-field:hover:not(:focus-within) {
  border-color: rgba(var(--v-theme-on-surface), 0.6);
}

.number-stepper-field:focus-within {
  border-color: transparent;
  outline: 1px solid rgb(var(--v-theme-primary));
  outline-offset: -1px;
}

.number-stepper-field__input {
  /* Vuetify hides every input inside a slider container */
  display: block;
  padding: 0px 2px;
  border: 0;
  outline: none;
  color: currentColor;
  background: transparent;
  font: inherit;
  line-height: calc(var(--number-stepper-field-height) - 4px);
}

.number-stepper-field__prefix {
  display: flex;
  align-items: center;
  padding-left: 4px;
  opacity: var(--v-medium-emphasis-opacity);
  cursor: text;
  user-select: none;
}

/* Inset in the field, like the spin buttons of a number input */
.number-stepper-field__steppers {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px;
}

.number-stepper-field__steppers > button {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  width: calc(var(--number-stepper-field-height) / 2 + 2px);
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 2px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.number-stepper-field__steppers > button:hover {
  background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}
</style>
