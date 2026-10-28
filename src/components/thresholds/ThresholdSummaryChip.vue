<template>
  <v-icon v-if="icon" :size="12" :icon="toResourceIcon(icon)" />
  <v-chip
    v-if="count"
    size="small"
    class="ms-1 px-2 threshold-count"
    density="compact"
    variant="flat"
    :color
  >
    {{ count }}
  </v-chip>
</template>

<script lang="ts" setup>
import { toResourceIcon } from '@/lib/icons'

interface Props {
  icon?: string
  count?: number
  color?: string
}

withDefaults(defineProps<Props>(), {
  color: '#00BBF0',
})
</script>

<style scoped>
.threshold-count {
  min-width: 4.3ch;
  justify-content: center;
}
</style>
