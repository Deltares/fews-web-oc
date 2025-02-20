<template>
  <v-list-item prepend-icon="mdi-server" density="compact">
    Number of available servers: {{ formattedNumAvailableServers }}
  </v-list-item>
</template>
<script setup lang="ts">
import { WorkflowItem } from '@/lib/workflows'
import { configManager } from '@/services/application-config'
import { useFssInfo } from '@/services/useFssInfo'
import { computed } from 'vue'

interface Props {
  workflow: WorkflowItem | undefined
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { fssInfo } = useFssInfo(baseUrl, () => props.workflow?.id)

const placeholder = '—'
const formattedNumAvailableServers = computed(() => {
  const numAvailableServers = fssInfo.value?.forecastingShellCount
  return numAvailableServers?.toString() ?? placeholder
})
</script>
