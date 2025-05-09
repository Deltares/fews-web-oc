<template>
  <div>
    <v-card
      :class="
        isLogMessageByCurrentUser(log, props.userName)
          ? 'current-user-message'
          : 'other-message'
      "
      border
      flat
      density="compact"
      width="45%"
    >
      <template #title>
        <div class="d-flex align-center ga-2">
          <v-list-item-title :style="{ color: logToUserColor(log, userName) }">
            {{ logToUser(log, userName) }}
          </v-list-item-title>
          <v-card-subtitle class="align-self-end">{{
            toHumanReadableDate(log.entryTime)
          }}</v-card-subtitle>
          <template v-if="isEditing">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  density="compact"
                  icon="mdi-close"
                  variant="plain"
                  size="small"
                  v-bind="props"
                  @click="toggleEditing"
                />
              </template>
              <span>Discard changes</span>
            </v-tooltip>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  density="compact"
                  icon="mdi-check"
                  variant="plain"
                  size="small"
                  color="success"
                  v-bind="props"
                  @click="saveEdit"
                />
              </template>
              <span>Save changes</span>
            </v-tooltip>
          </template>
          <v-menu location="bottom" :close-on-content-click="true">
            <template #activator="{ props }">
              <v-btn
                v-if="!isEditing"
                density="compact"
                icon="mdi-dots-horizontal"
                variant="plain"
                size="small"
                v-bind="props"
              />
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
              <template
                v-if="!isEditing"
                v-for="dissemination in logToActions(log, disseminations)"
              >
                <v-list-item
                  :prepend-icon="dissemination.iconId"
                  :title="dissemination.description"
                  @click="emit('disseminateLog', log, dissemination)"
                />
              </template>
            </v-list>
          </v-menu>
          <template v-if="isAcknowledged">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  density="compact"
                  size="small"
                  v-if="!isEditing && isAcknowledged"
                  icon="mdi-check-all"
                  color="primary"
                  title="Remove acknowledgement"
                  @click="emit('unacknowledgeLog', log)"
                  v-bind="props"
                />
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
        </div>
        <div v-else class="d-flex">
          <span class="message-text"> {{ log.text }} </span>
          <v-spacer />
          <slot name="actions"></slot>
        </div>
      </v-card-text>
      <template #append>
        <v-card-subtitle class="pa-1">{{
          levelToTitle(log.level)
        }}</v-card-subtitle>
        <v-icon
          v-if="logToIcon(log) && !isEditing"
          size="small"
          :icon="logToIcon(log)"
          :color="isAcknowledged ? undefined : logToColor(log)"
        />
      </template>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { toHumanReadableDate } from '@/lib/date'
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
} from '@/lib/log'
import type {
  ForecasterNoteGroup,
  LogDisplayDisseminationAction,
} from '@deltares/fews-pi-requests'

interface Props {
  noteGroup: ForecasterNoteGroup
  log: LogMessage
  userName: string
  disseminations: LogDisplayDisseminationAction[]
}

const props = defineProps<Props>()
const emit = defineEmits<LogActionEmit>()

const isEditing = ref(false)
const editedText = ref('')
const editedLogLevel = ref<ManualLogLevel>('INFO')

// Compute the acknowledgement status using our new function
const isAcknowledged = computed(() => props.log.eventAcknowledged)

// Text validation constants
const maxLines = computed(() => props.noteGroup.note.maxNumberOfLines)
const maxChars = computed(
  () => props.noteGroup.note.maxNumberOfCharactersInLine,
)

// Determine if the current user can edit this message
const canEdit = computed(() => {
  return true
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
  // Don't save if there are validation errors
  if (isError.value) {
    return
  }

  // Create a copy of the log with updated text and level
  const updatedLog = {
    ...props.log,
    text: editedText.value,
    level: editedLogLevel.value === 'CRITICAL' ? 'ERROR' : editedLogLevel.value,
  }
  emit('editLog', updatedLog as LogMessage)
  isEditing.value = false
}
</script>

<style scoped>
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
</style>
