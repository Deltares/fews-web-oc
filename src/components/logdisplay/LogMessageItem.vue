<template>
  <div>
    <v-card
      :class="[
        isLogMessageByCurrentUser(props.log, props.userName)
          ? 'current-user-message'
          : 'other-message',
        'log-message-card',
        `log-message-card--${acknowledgedLogToColor(log).toLowerCase()}`,
      ]"
      border
      flat
      :variant="isDark ? undefined : 'tonal'"
      :color="logToUserColor(log, userName)"
      density="compact"
    >
      <template #title>
        <div class="d-flex align-center ga-2">
          <span class="text-label-large text-medium-emphasis">
            {{ logToUser(log, userName) }}
          </span>
          <span class="text-label-large text-medium-emphasis">
            {{ toHumanReadableTime(log.entryTime) }}
          </span>
          <v-menu location="bottom" :close-on-content-click="false">
            <template #activator="{ props }">
              <v-btn
                v-if="!isEditing"
                density="compact"
                icon
                size="small"
                v-bind="props"
              >
                <v-icon size="x-small">mdi-dots-horizontal</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                v-if="log.topologyNodeId"
                :to="logToRoute(log)"
                prepend-icon="mdi-link-variant"
                title="Go to node"
              />
              <v-list-item
                v-if="!isEditing && !isAcknowledged"
                prepend-icon="mdi-check"
                title="Acknowledge message"
                @click="emit('acknowledgeLog', log)"
              />
              <v-list-item
                v-if="!isEditing && isAcknowledged"
                prepend-icon="mdi-undo"
                title="Remove acknowledgement"
                @click="emit('unacknowledgeLog', log)"
              />
              <v-list-item
                v-if="canEdit && !isEditing"
                prepend-icon="mdi-pencil"
                title="Edit message"
                @click="toggleEditing"
              />
              <v-list-item
                v-if="!isEditing && canEdit"
                prepend-icon="mdi-delete"
                title="Delete message"
                @click="emit('deleteLog', log)"
              />
              <LogDisseminations
                :log="log"
                :disseminations="logToActions(log, disseminations)"
                :disseminationStatus="props.disseminationStatus"
                @disseminate-log="
                  (log, dis) => emit('disseminateLog', log, dis)
                "
              />
            </v-list>
          </v-menu>
          <template v-if="isAcknowledged">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  density="compact"
                  icon
                  size="small"
                  v-if="!isEditing && isAcknowledged"
                  title="Remove acknowledgement"
                  @click="emit('unacknowledgeLog', log)"
                  v-bind="props"
                >
                  <v-icon size="x-small">mdi-check</v-icon>
                </v-btn>
              </template>
              <span>Remove acknowledgement</span>
            </v-tooltip>
          </template>
        </div>
      </template>
      <NewLogMessage
        v-if="isEditing"
        mode="edit"
          :inline="true"
        :note-group="noteGroup"
        :initial-text="log.text"
        :initial-log-level="editedLogLevel"
        save-button-label="Save changes"
        @save="saveEdit"
        @discard="toggleEditing"
      />
      <v-card-text v-else>
        <span class="message-text"> {{ log.text }} </span>
        <v-spacer />
        <slot name="actions"></slot>
      </v-card-text>
      <template #append>
        <v-icon
          v-if="log.level !== 'INFO' && !isEditing"
          size="small"
          :icon="logToIcon(log)"
          :color="logToColor(log)"
          :disabled="isAcknowledged"
        />
      </template>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { toHumanReadableTime } from '@/lib/date'
import { ref, computed } from 'vue'
import {
  isLogMessageByCurrentUser,
  logToIcon,
  logToUser,
  logToUserColor,
  logToColor,
  logToRoute,
  logToActions,
  type LogMessage,
  type LogActionEmit,
  type ManualLogLevel,
  type LogDisseminationStatus,
} from '@/lib/log'
import type {
  ForecasterNoteGroup,
  LogDisplayDisseminationAction,
} from '@deltares/fews-pi-requests'
import LogDisseminations from '@/components/logdisplay/LogDisseminations.vue'
import NewLogMessage from '@/components/logdisplay/NewLogMessage.vue'
import { useDark } from '@/services/useDark'

interface Props {
  noteGroup: ForecasterNoteGroup
  log: LogMessage
  userName: string
  disseminations: LogDisplayDisseminationAction[]
  disseminationStatus: Record<string, LogDisseminationStatus>
}

const props = defineProps<Props>()
const emit = defineEmits<LogActionEmit>()
const isDark = useDark()

const isEditing = ref(false)
const editedLogLevel = ref<ManualLogLevel>('INFO')

const isAcknowledged = computed(() => props.log.eventAcknowledged)

const canEdit = computed(() => {
  // Allow editing only for manual logs created by the current user
  return (
    props.log.type === 'manual' &&
    isLogMessageByCurrentUser(props.log, props.userName)
  )
})

function toggleEditing() {
  if (canEdit.value) {
    if (isEditing.value) {
      isEditing.value = false
    } else {
      editedLogLevel.value =
        props.log.level == 'ERROR' ? 'CRITICAL' : props.log.level
      isEditing.value = true
    }
  }
}

function saveEdit(payload: { text: string; logLevel: ManualLogLevel }) {
  if (canEdit.value) {
    const updatedLog = {
      ...props.log,
      text: payload.text,
      level: payload.logLevel === 'CRITICAL' ? 'ERROR' : payload.logLevel,
    }
    emit('editLog', updatedLog as LogMessage)
    isEditing.value = false
  }
}

function acknowledgedLogToColor(log: LogMessage) {
  return logToColor(log)
}
</script>

<style scoped>
.log-message-card {
  transition: border-color 0.15s ease;
}

.log-message-card--warning {
  border-color: rgb(var(--v-theme-warning));
}

.log-message-card--error {
  border-color: rgb(var(--v-theme-error));
}

.message-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.edit-message-textarea {
  width: 100%;
}

.current-user-message {
  margin-left: auto;
}

.other-message {
  margin-right: auto;
}

.level-label {
  display: flex;
  align-items: center;
  justify-content: start;
  column-gap: 0.25em;
  width: 6.5em;
}
</style>
