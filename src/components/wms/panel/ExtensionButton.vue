<template>
  <v-btn
    :value="value"
    class="information-panel__tab text-label-medium"
    size="small"
    :class="{ active: isActive }"
    :prepend-icon="prependIcon"
    :icon="icon"
    :append-icon="appendIcon"
    :text="buttonText"
    :min-width="isActive ? '55px' : '30px'"
  />
</template>

<script setup lang="ts" generic="T">
import { computed } from 'vue'

interface Props {
  isActive: boolean
  value: T
  text?: string
  icon?: string
  activePrependIcon?: string
}

const props = defineProps<Props>()

const hasText = computed<boolean>(
  () => props.text !== undefined && props.text !== '',
)

// Use icon instead of append icon when no text is present.
const buttonText = computed<string | undefined>(() =>
  hasText.value ? props.text : undefined,
)
const icon = computed<string | undefined>(() =>
  hasText.value ? undefined : props.icon,
)
const appendIcon = computed<string | undefined>(() =>
  hasText.value ? props.icon : undefined,
)
// Only show the prepend icon for active buttons.
const prependIcon = computed<string | undefined>(() =>
  props.isActive ? props.activePrependIcon : undefined,
)
</script>

<style scoped>
.information-panel__tab {
  padding: 5px 10px;
  background-color: rgba(var(--v-theme-surface), 0.8);
  cursor: pointer;
}

.information-panel__tab.active {
  border-radius: 3px;
}
</style>
