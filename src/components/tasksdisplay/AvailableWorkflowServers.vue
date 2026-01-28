<template>
  <v-list-item prepend-icon="mdi-server" density="compact">
    {{ t('workflow.numberOfAvailableServers') }}:
    {{ formattedNumAvailableServers }}
  </v-list-item>
</template>
<script setup lang="ts">
import { WorkflowItem } from '@/lib/workflows'
import { configManager } from '@/services/application-config'
import { useFssInfo } from '@/services/useFssInfo'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  workflow: WorkflowItem | undefined
}

const props = defineProps<Props>()
const { t } = useI18n()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { fssInfo } = useFssInfo(baseUrl, () => props.workflow?.id)

const placeholder = '—'
const formattedNumAvailableServers = computed(() => {
  const numAvailableServers = fssInfo.value?.forecastingShellCount
  return numAvailableServers?.toString() ?? placeholder
})
</script>
