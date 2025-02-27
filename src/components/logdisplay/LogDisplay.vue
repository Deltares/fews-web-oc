<template>
  <LogDisplayComponent
    v-if="logDisplay"
    :key="logDisplay.id"
    :logDisplay
    :noteGroup
  />
</template>

<script setup lang="ts">
import LogDisplayComponent from './LogDisplayComponent.vue'
import { configManager } from '@/services/application-config'
import { useLogDisplay } from '@/services/useLogDisplay'
import { useNoteGroup } from '@/services/useNoteGroup'
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
const { noteGroup } = useNoteGroup(
  baseUrl,
  () => logDisplay.value?.manualLog?.noteGroupId,
)
</script>
