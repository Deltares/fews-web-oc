<template>
  <span class="highlight-match" @mousedown.prevent>
    <span>{{ match.before }}</span>
    <span class="font-weight-bold">{{ match.match }}</span>
    <span>{{ match.after }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { findMatchingParts } from '@/lib/search'

interface Props {
  value: string
  query?: string
}
const props = defineProps<Props>()

const match = computed(() => findMatchingParts(props.value, props.query ?? ''))
</script>

<style scoped>
.highlight-match {
  user-select: none;
  -webkit-user-select: none;
}
</style>
