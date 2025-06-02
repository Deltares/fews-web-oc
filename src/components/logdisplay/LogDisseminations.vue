<template>
  <template v-for="dissemination in disseminations">
    <v-dialog width="auto">
      <template #activator="{ props }">
        <v-list-item
          v-bind="props"
          :prepend-icon="dissemination.iconId"
          :title="dissemination.description"
          :lines="false"
          :disabled="isDisseminationDisabled(dissemination)"
        >
          <template v-if="isDisseminationLoading(dissemination)" #prepend>
            <div class="v-icon v-icon--size-default">
              <v-progress-circular indeterminate width="2" />
            </div>
          </template>
        </v-list-item>
      </template>
      <template #default="{ isActive }">
        <v-card
          :prepend-icon="dissemination.iconId"
          :title="dissemination.description"
        >
          <v-card-text>
            Are you sure you want to disseminate this log?
          </v-card-text>
          <v-card-actions>
            <v-btn text @click="isActive.value = false">Cancel</v-btn>
            <v-btn
              color="primary"
              @click="
                () => {
                  emit('disseminateLog', log, dissemination)
                  isActive.value = false
                }
              "
            >
              Confirm
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </template>
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

function isDisseminationDisabled(
  dissemination: LogDisplayDisseminationAction,
): boolean {
  const key = getLogDisseminationKey(props.log, dissemination)
  const success = props.disseminationStatus[key]?.success ?? false
  const isLoading = props.disseminationStatus[key]?.isLoading ?? false
  return success || isLoading
}
</script>
