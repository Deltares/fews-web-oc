<template>
  <v-list-item
    v-for="dissemination in disseminations"
    :prepend-icon="dissemination.iconId"
    :title="dissemination.description"
    :lines="false"
    @click="emit('disseminateLog', log, dissemination)"
    :disabled="isDisseminationSuccessful(dissemination)"
  >
    <template v-if="isDisseminationLoading(dissemination)" #prepend>
      <div class="v-icon v-icon--size-default">
        <v-progress-circular indeterminate width="2" />
      </div>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import {
  getLogDisseminationKey,
  type LogActionEmit,
  type LogDisseminationStatus,
  type LogMessage,
} from '@/lib/log'
import type { LogDisplayDisseminationAction } from '@deltares/fews-pi-requests'

interface Props {
  log: LogMessage
  disseminations: LogDisplayDisseminationAction[]
  disseminationStatus: Record<string, LogDisseminationStatus>
}

const props = defineProps<Props>()

const emit = defineEmits<LogActionEmit>()

function isDisseminationLoading(
  dissemination: LogDisplayDisseminationAction,
): boolean {
  const key = getLogDisseminationKey(props.log, dissemination)
  return props.disseminationStatus[key]?.isLoading ?? false
}

function isDisseminationSuccessful(
  dissemination: LogDisplayDisseminationAction,
): boolean {
  const key = getLogDisseminationKey(props.log, dissemination)
  return props.disseminationStatus[key]?.success ?? false
}
</script>
