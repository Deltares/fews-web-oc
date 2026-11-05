<template>
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <polygon
      v-if="hasNonPointFeatures"
      points="2,4 11,2 14,10 8,14 3,11"
      :fill="isDark ? 'darkgrey' : '#dfdfdf'"
      :stroke="isDark ? 'white' : 'black'"
      stroke-width="1"
      stroke-linejoin="round"
    />
    <circle
      v-if="hasPointFeatures"
      cx="8"
      cy="8"
      :r="hasNonPointFeatures ? 3 : 5"
      fill="#dfdfdf"
      stroke="black"
      stroke-width="1.5"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  hasPointFeatures: boolean
  hasNonPointFeatures: boolean
  isDark: boolean
}

defineProps<Props>()
</script>
