<template>
  <div class="new-log-inline" v-if="noteGroup">
    <v-card flat class="new-log-card">
      <div class="inner">
        <v-textarea
          v-model="text"
          :label="`New message (${lineCount}/${maxLines} lines, ${charCount}/${maxChars} characters per line)`"
          :placeholder="noteGroup.note.messageTemplate.message"
          :rows="Math.min(maxLines, 5)"
          :max-length="maxLines * maxChars"
          :error="isError"
          :error-messages="errorMessage"
          class="message-textarea mb-1"
          density="compact"
          no-resize
          variant="outlined"
          @input="validateInput"
        />
        <v-alert
          v-if="postErrorMessage"
          type="error"
          density="compact"
          :title="postErrorMessage"
          class="mt-1 mb-1"
        />
        <div class="actions-row">
          <v-select
            v-model="newLogLevel"
            :items="manualLogLevels"
            :item-title="levelToTitle"
            :item-value="(item) => item"
            class="level-select"
            hide-details
            density="compact"
            variant="outlined"
            label="Message level"
          />
          <div class="flex-spacer" />
          <v-btn
            variant="flat"
            size="small"
            :disabled="(!text && !newLogLevelChanged) || isPosting"
            @click="discard"
            >Discard</v-btn
          >
          <v-btn
            variant="flat"
            size="small"
            color="primary"
            :disabled="!text.trim() || isError || isPosting"
            :loading="isPosting"
            @click="saveNewMessage"
            >Send</v-btn
          >
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { levelToTitle, manualLogLevels, type ManualLogLevel } from '@/lib/log'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import {
  ForecasterNoteRequest,
  LogDisplayLogs,
  PiWebserviceProvider,
  type ForecasterNoteGroup,
} from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'

interface Props {
  noteGroup?: ForecasterNoteGroup
}
const props = defineProps<Props>()
const emit = defineEmits(['newNote'])

const maxLines = computed(() => props.noteGroup?.note.maxNumberOfLines ?? 0)
const maxChars = computed(
  () => props.noteGroup?.note.maxNumberOfCharactersInLine ?? 0,
)

const text = ref('')
const newLogLevel = ref<ManualLogLevel>('INFO')
const postErrorMessage = ref<string>()
const isPosting = ref(false)

const lineCount = computed(() => text.value.split('\n').length)
const charCount = computed(() =>
  Math.max(...text.value.split('\n').map((l) => l.length), 0),
)

const isError = computed(
  () =>
    !!props.noteGroup &&
    (lineCount.value > maxLines.value || charCount.value > maxChars.value),
)
const errorMessage = computed(() => {
  if (!props.noteGroup) return ''
  if (lineCount.value > maxLines.value)
    return `Maximum ${maxLines.value} lines allowed`
  if (charCount.value > maxChars.value)
    return `Maximum ${maxChars.value} characters per line allowed`
  return ''
})

function validateInput() {
  if (!props.noteGroup) return
  let lines = text.value.split('\n')
  if (lines.length > maxLines.value) lines = lines.slice(0, maxLines.value)
  lines = lines.map((line) => line.slice(0, maxChars.value))
  text.value = lines.join('\n')
}

async function saveNewMessage() {
  if (!props.noteGroup) return
  postErrorMessage.value = undefined
  isPosting.value = true
  const response = await postNewLogMessage(
    props.noteGroup.id,
    text.value,
    newLogLevel.value === 'CRITICAL' ? 'ERROR' : newLogLevel.value,
  )
  isPosting.value = false
  if (response.success) {
    text.value = ''
    newLogLevel.value = 'INFO'
    emit('newNote')
  } else {
    postErrorMessage.value = response.error
  }
}

function discard() {
  text.value = ''
  newLogLevel.value = 'INFO'
  postErrorMessage.value = undefined
}

const initialLevel = 'INFO'
const newLogLevelChanged = computed(() => newLogLevel.value !== initialLevel)

async function postNewLogMessage(
  noteGroupId: string,
  logMessage: string,
  logLevel: LogDisplayLogs['level'],
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const note: ForecasterNoteRequest = { noteGroupId, logMessage, logLevel }
  try {
    await provider.postForecasterNote(note)
    return { success: true }
  } catch (e) {
    console.error(`Failed to save new log message: ${e}`)
    return { error: 'Failed to save new log message' }
  }
}
</script>

<style scoped>
.new-log-inline {
  width: 100%;
}
.new-log-card {
  border: 1px solid var(--v-theme-surface-variant, #ddd);
}
.inner {
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.message-textarea {
  width: 100%;
}
.actions-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 2px;
}
.level-select {
  max-width: 150px;
}
.flex-spacer {
  flex: 1 1 auto;
}
:deep(.message-textarea .v-field) {
  --v-field-padding-bottom: 2px;
}
@media (max-width: 700px) {
  .level-select {
    max-width: 120px;
  }
}
</style>
