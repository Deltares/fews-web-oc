<template>
  <LogDisplayComponent
    v-if="logDisplay"
    :key="logDisplay.id"
    :logDisplay="logDisplay"
    :noteGroup
  />
</template>

<script setup lang="ts">
import LogDisplayComponent from './LogDisplayComponent.vue'
import { useLogDisplay } from '@/services/useLogDisplay'
import { useNoteGroup } from '@/services/useNoteGroup'

interface Props {
  logDisplayId?: string
}

const props = defineProps<Props>()

const { logDisplay } = useLogDisplay(() => props.logDisplayId)
const { noteGroup } = useNoteGroup(
  () => logDisplay.value?.manualLog?.noteGroupId,
)
</script>
