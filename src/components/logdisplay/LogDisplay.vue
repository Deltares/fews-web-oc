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

interface Props {
  logDisplayId?: string
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { logDisplay } = useLogDisplay(baseUrl, () => props.logDisplayId)
const { noteGroup } = useNoteGroup(
  baseUrl,
  () => logDisplay.value?.manualLog?.noteGroupId,
)
</script>
