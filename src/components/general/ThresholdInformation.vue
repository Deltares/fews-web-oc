<template>
  <v-avatar v-if="icon" tile :size="12" :image="getResourcesIconsUrl(icon)" />
  <v-chip
    v-if="count"
    size="small"
    class="ms-1 px-2 threshold-count"
    density="compact"
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
  color: 'orange-darken-4',
})
</script>

<style scoped>
.threshold-count {
  min-width: 4.3ch;
  justify-content: center;
}
</style>
