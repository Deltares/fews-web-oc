<template>
  <OperatorLog v-if="logDisplay" :logDisplay />
  <div v-else>
    <v-alert type="warning" class="ma-3">No logs display available</v-alert>
  </div>
</template>

<script setup lang="ts">
import OperatorLog from '@/components/logdisplay/OperatorLog.vue'
import { configManager } from '@/services/application-config'
import { useLogDisplay } from '@/services/useLogDisplay'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { logDisplay } = useLogDisplay(
  baseUrl,
  () => props.topologyNode?.logDisplay?.id,
)
</script>
