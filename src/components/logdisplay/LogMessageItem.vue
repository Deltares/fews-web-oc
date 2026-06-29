<template>
  <div>
    <v-card
      :class="[
        isLogMessageByCurrentUser(props.log, props.userName)
          ? 'current-user-message'
          : 'other-message',
        'log-message-card',
        `log-message-card--${acknowledgedLogToColor(log, isAcknowledged).toLowerCase()}`,
      ]"
      border
      flat
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
                prepend-icon="mdi-check-all"
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
                  color="success"
                  title="Remove acknowledgement"
                  @click="emit('unacknowledgeLog', log)"
                  v-bind="props"
                >
                  <v-icon size="x-small">mdi-check-all</v-icon>
                </v-btn>
              </template>
              <span>Remove acknowledgement</span>
            </v-tooltip>
          </template>
        </div>
      </template>
      <v-card-text>
        <div v-if="isEditing" class="d-flex flex-column">
          <v-select
            v-model="editedLogLevel"
            :items="manualLogLevels"
            :item-title="levelToTitle"
            :item-value="(item) => item"
            label="Log level"
            variant="outlined"
            density="compact"
            class="mb-2"
          />
          <v-textarea
            v-model="editedText"
            :label="`Message (${lineCount}/${maxLines} lines, ${charCount}/${maxChars} characters per line)`"
            auto-grow
            variant="outlined"
            density="compact"
            :rows="maxLines"
            :max-length="maxLines * maxChars"
            :error="isError"
            :error-messages="errorMessage"
            no-resize
            @input="validateInput"
            class="edit-message-textarea"
          ></v-textarea>
          <div class="d-flex justify-end">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  density="compact"
                  icon
                  variant="plain"
                  v-bind="props"
                  @click="toggleEditing"
                >
                  <v-icon size="small">mdi-close</v-icon>
                </v-btn>
              </template>
              <span>Discard changes</span>
            </v-tooltip>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  density="compact"
                  icon="mdi-check"
                  variant="plain"
                  color="success"
                  v-bind="props"
                  @click="saveEdit"
                />
              </template>
              <span>Save changes</span>
            </v-tooltip>
          </div>
        </div>
        <div v-else class="d-flex">
          <span class="message-text"> {{ log.text }} </span>
          <v-spacer />
          <slot name="actions"></slot>
        </div>
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
  levelToTitle,
  manualLogLevels,
  type ManualLogLevel,
  type LogDisseminationStatus,
} from '@/lib/log'
import type {
  ForecasterNoteGroup,
  LogDisplayDisseminationAction,
} from '@deltares/fews-pi-requests'
import LogDisseminations from '@/components/logdisplay/LogDisseminations.vue'

interface Props {
  noteGroup: ForecasterNoteGroup
  log: LogMessage
  userName: string
  disseminations: LogDisplayDisseminationAction[]
  disseminationStatus: Record<string, LogDisseminationStatus>
}

const props = defineProps<Props>()
const emit = defineEmits<LogActionEmit>()

const isEditing = ref(false)
const editedText = ref('')
const editedLogLevel = ref<ManualLogLevel>('INFO')

const isAcknowledged = computed(() => props.log.eventAcknowledged)

// Text validation constants
const maxLines = computed(() => props.noteGroup.note.maxNumberOfLines)
const maxChars = computed(
  () => props.noteGroup.note.maxNumberOfCharactersInLine,
)

const canEdit = computed(() => {
  // Allow editing only for manual logs created by the current user
  return (
    props.log.type === 'manual' &&
    isLogMessageByCurrentUser(props.log, props.userName)
  )
})

// Text validation computed properties
const lineCount = computed(() => editedText.value.split('\n').length)
const charCount = computed(() =>
  Math.max(...editedText.value.split('\n').map((line) => line.length)),
)

const isError = computed(
  () => lineCount.value > maxLines.value || charCount.value > maxChars.value,
)

const errorMessage = computed(() => {
  if (lineCount.value > maxLines.value)
    return `Maximum ${maxLines} lines allowed`
  if (charCount.value > maxChars.value)
    return `Maximum ${maxChars} characters per line allowed`
  return ''
})

function validateInput() {
  let lines = editedText.value.split('\n')

  // Trim lines if more than allowed
  if (lines.length > maxLines.value) {
    lines = lines.slice(0, maxLines.value)
  }

  // Trim characters per line if more than allowed
  lines = lines.map((line) => line.slice(0, maxChars.value))

  editedText.value = lines.join('\n')
}

function toggleEditing() {
  if (!canEdit.value) {
    return
  }
  if (!isEditing.value) {
    editedText.value = props.log.text
    editedLogLevel.value =
      props.log.level == 'ERROR' ? 'CRITICAL' : props.log.level
    isEditing.value = true
  } else {
    isEditing.value = false
  }
}

function saveEdit() {
  if (!canEdit.value) {
    return
  }
  if (isError.value) {
    return
  }
  const updatedLog = {
    ...props.log,
    text: editedText.value,
    level: editedLogLevel.value === 'CRITICAL' ? 'ERROR' : editedLogLevel.value,
  }
  emit('editLog', updatedLog as LogMessage)
  isEditing.value = false
}

function acknowledgedLogToColor(log: LogMessage) {
  if (log.eventAcknowledged) {
    return 'ACKNOWLEDGED'
  }
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
