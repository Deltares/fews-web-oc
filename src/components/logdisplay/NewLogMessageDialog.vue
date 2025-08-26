<template>
  <v-dialog v-model="newMessageDialog" max-width="500px">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="flat"
        color="primary"
        class="ms-auto"
        text="New message"
      />
    </template>
    <v-card>
      <v-card-title>New Log Message</v-card-title>
      <v-card-text>
        <v-select
          v-model="newLogLevel"
          :items="manualLogLevels"
          :item-title="levelToTitle"
          :item-value="(item) => item"
          label="Log level"
          variant="outlined"
        />
        <v-textarea
          v-model="text"
          :label="`Message (${lineCount}/${maxLines} lines, ${charCount}/${maxChars} characters per line)`"
          :placeholder="noteGroup.note.messageTemplate.message"
          :rows="maxLines"
          :max-length="maxLines * maxChars"
          :error="isError"
          :error-messages="errorMessage"
          no-resize
          @input="validateInput"
          variant="outlined"
        />
        <v-alert
          v-if="postErrorMessage"
          type="error"
          density="compact"
          :title="postErrorMessage"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn
          text="Send"
          variant="flat"
          color="primary"
          :loading="isPosting"
          @click="saveNewMessage"
        />
        <v-btn text="Close" @click="newMessageDialog = false" />
      </v-card-actions>
    </v-card>
  </v-dialog>
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
  noteGroup: ForecasterNoteGroup
}

const props = defineProps<Props>()
const emit = defineEmits(['newNote'])

const maxLines = computed(() => props.noteGroup.note.maxNumberOfLines)
const maxChars = computed(
  () => props.noteGroup.note.maxNumberOfCharactersInLine,
)

const lineCount = computed(() => text.value.split('\n').length)
const charCount = computed(() =>
  Math.max(...text.value.split('\n').map((line) => line.length)),
)

const isError = computed(
  () => lineCount.value > maxLines.value || charCount.value > maxChars.value,
)
const errorMessage = computed(() => {
  if (lineCount.value > maxLines.value)
    return `Maximum ${maxLines.value} lines allowed`
  if (charCount.value > maxChars.value)
    return `Maximum ${maxChars.value} characters per line allowed`
  return ''
})

const validateInput = () => {
  let lines = text.value.split('\n')

  // Trim lines if more than allowed
  if (lines.length > maxLines.value) {
    lines = lines.slice(0, maxLines.value)
  }

  // Trim characters per line if more than allowed
  lines = lines.map((line) => line.slice(0, maxChars.value))

  text.value = lines.join('\n')
}

const newMessageDialog = ref(false)
const newLogLevel = ref<ManualLogLevel>('INFO')
const text = ref('')
const postErrorMessage = ref<string>()

const isPosting = ref(false)

async function saveNewMessage() {
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
    newMessageDialog.value = false
    emit('newNote')
  } else {
    postErrorMessage.value = response.error
  }
}

async function postNewLogMessage(
  noteGroupId: string,
  logMessage: string,
  logLevel: LogDisplayLogs['level'],
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const note: ForecasterNoteRequest = {
    noteGroupId,
    logMessage,
    logLevel,
  }

  try {
    await provider.postForecasterNote(note)
    return { success: true }
  } catch (e) {
    console.error(`Failed to save new log message: ${e}`)
    return { error: 'Failed to save new log message' }
  }
}
</script>
