<template>
  <v-card
    ref="composerCardRef"
    flat
    border
    class="w-100"
    :class="['new-log-card', `new-log-card--${levelToColor(newLogLevel)}`]"
    density="compact"
    @mouseup="handleClick"
    @focusin="handleFocusIn"
  >
    <v-card-actions v-if="showExpandedUi" class="pt-0">
      <v-menu location="bottom start">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="tonal"
            size="small"
            :prepend-icon="levelToIcon(newLogLevel)"
            append-icon="mdi-menu-down"
            :color="levelToColor(newLogLevel)"
            class="text-label-large"
          >
            {{ levelToTitle(newLogLevel) }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="level in manualLogLevels"
            :key="level"
            @click="newLogLevel = level"
          >
            <v-list-item-title>{{ levelToTitle(level) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-spacer />
      <v-btn
        icon="mdi-close"
        size="x-small"
        :disabled="isPosting"
        @click="discard"
      />
    </v-card-actions>
    <div class="d-flex" :class="showExpandedUi ? 'flex-column' : 'flex-row'">
      <v-textarea
        ref="messageTextareaRef"
        v-model="text"
        :placeholder="
          props.noteGroup?.note.messageTemplate.message ??
          'Enter log message...'
        "
        :rows="1"
        :max-rows="Math.max(maxLines, 5)"
        :max-length="maxLines * maxChars"
        :error="isError"
        :error-messages="errorMessage"
        density="compact"
        auto-grow
        no-resize
        hide-details="auto"
        variant="plain"
        class="message-textarea"
        :class="showExpandedUi ? 'expanded' : 'collapsed'"
        @input="validateInput"
      />
      <v-alert
        v-if="postErrorMessage"
        type="error"
        density="compact"
        :title="postErrorMessage"
        class="mt-1 mb-1"
      />
      <div class="d-flex align-center ma-2">
        <span
          class="text-medium-emphasis text-label-medium"
          v-if="showExpandedUi"
        >
          {{ lineCount }}/{{ maxLines }} lines, {{ charCount }}/{{ maxChars }}
          characters per line
        </span>
        <v-spacer />
        <v-btn
          variant="flat"
          size="small"
          :color="levelToColor(newLogLevel)"
          :disabled="!text.trim() || isError || isPosting"
          :loading="isPosting"
          @click="saveNewMessage"
          >Send</v-btn
        >
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import {
  levelToColor,
  levelToIcon,
  levelToTitle,
  manualLogLevels,
  type ManualLogLevel,
} from '@/lib/log'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import {
  ForecasterNoteRequest,
  LogDisplayLogs,
  PiWebserviceProvider,
  type ForecasterNoteGroup,
} from '@deltares/fews-pi-requests'
import { computed, ref, useTemplateRef } from 'vue'

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
const isUiExpanded = ref(false)
const messageTextareaRef = useTemplateRef('messageTextareaRef')

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

function expandUi() {
  isUiExpanded.value = true
}

function focusTextarea() {
  const textareaComponent = messageTextareaRef.value
  if (textareaComponent?.focus) {
    textareaComponent.focus()
  }
}

async function handleClick(event: MouseEvent) {
  expandUi()
  focusTextarea()
}

async function handleFocusIn(event: FocusEvent) {
  expandUi()
  focusTextarea()
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
    isUiExpanded.value = false
    emit('newNote')
  } else {
    postErrorMessage.value = response.error
  }
}

function discard() {
  text.value = ''
  newLogLevel.value = 'INFO'
  postErrorMessage.value = undefined
  isUiExpanded.value = false
  const activeEl = document.activeElement
  if (activeEl instanceof HTMLElement) {
    activeEl.blur()
  }
}

const showExpandedUi = computed(
  () =>
    isUiExpanded.value ||
    !!text.value.trim() ||
    isPosting.value ||
    !!postErrorMessage.value,
)

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
.new-log-card {
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.new-log-card--info:focus-within {
  border-color: rgb(var(--v-theme-info));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-info));
}

.new-log-card--warning:focus-within {
  border-color: rgb(var(--v-theme-warning));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-warning));
}

.new-log-card--error:focus-within {
  border-color: rgb(var(--v-theme-error));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-error));
}

:deep(.message-textarea.collapsed .v-field__input) {
  padding: 8px;
}

:deep(.message-textarea.expanded .v-field__input) {
  padding: 0px 8px;
}

:deep(.message-textarea .v-field),
:deep(.message-textarea .v-field__input),
:deep(.message-textarea textarea) {
  -webkit-mask-image: none !important;
  mask-image: none !important;
}

/* Remove native browser focus ring on the <textarea> element */
:deep(.message-textarea textarea:focus) {
  outline: none !important;
}
</style>
