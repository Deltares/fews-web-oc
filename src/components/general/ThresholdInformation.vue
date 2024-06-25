<template>
  <v-avatar v-if="icon" tile :size="12" :image="getResourcesIconsUrl(icon)" />
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
import { getResourcesIconsUrl } from '@/lib/fews-config'

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
