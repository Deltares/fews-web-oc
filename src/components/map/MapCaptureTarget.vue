<template></template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import type { Map } from 'maplibre-gl'
import { useMap } from '@/services/useMap'

const emit = defineEmits<{
  change: [map: Map | undefined]
}>()
const { map } = useMap()
onMounted(() => emit('change', map))
onBeforeUnmount(() => emit('change', undefined))
</script>
