<template>
  <span>{{ match.before }}</span>
  <span class="font-weight-bold">{{ match.match }}</span>
  <span>{{ match.after }}</span>
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
