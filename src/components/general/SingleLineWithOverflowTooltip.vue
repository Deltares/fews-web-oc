<template>
  <div ref="container">
    <v-tooltip
      :text="text"
      location="center"
      :max-width="maxWidth"
      :disabled="!isOverflowing"
    >
      <template #activator="{ props }">
        <span v-bind="props" class="ellipsis-overflow">
          {{ text }}
        </span>
      </template>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

interface Props {
  text: string
  maxWidth?: string | number
}
defineProps<Props>()

const container = useTemplateRef('container')
const isOverflowing = computed<boolean>(() => {
  const element = container.value?.querySelector('span')
  if (!element) return false
  return element.scrollWidth > element.clientWidth
})
</script>

<style scoped>
.ellipsis-overflow {
  display: block;
  text-overflow: ellipsis ' [...]';
  white-space: nowrap;
  overflow: hidden;
}
</style>
