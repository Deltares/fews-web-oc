<template>
  <slot v-if="configuratorMode.isEnabled" />
</template>

<script setup lang="ts">
import { useConfiguratorModeStore } from '@/stores/configuratorMode'

const configuratorMode = useConfiguratorModeStore()
</script>
