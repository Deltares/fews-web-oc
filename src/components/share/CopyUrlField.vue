<template>
  <v-text-field
    :model-value="url"
    readonly
    hide-details
    density="compact"
    ref="field"
    @focus="selectEmbedUrl"
    :disabled="!url"
    variant="outlined"
    class="text-mono"
  >
    <template #append-inner>
      <v-btn
        :icon="state.icon"
        :color="state.color"
        v-tooltip:bottom="state.tooltip"
        @click.stop="copyToClipboard"
        density="comfortable"
        aria-label="Copy to clipboard"
      >
        <v-icon size="small">{{ state.icon }}</v-icon>
      </v-btn>
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  url: string
}
const props = defineProps<Props>()

const { t } = useI18n()

const field = useTemplateRef('field')

const initialState = {
  icon: 'mdi-content-copy',
  tooltip: t('share.copyLink'),
  color: 'default',
}

const state = ref({ ...initialState })

watch(
  () => props.url,
  () => {
    resetCopyState()
  },
)

function resetCopyState() {
  state.value = { ...initialState }
}

function delayedResetCopyState() {
  setTimeout(() => {
    resetCopyState()
  }, 3000)
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.url)
    state.value = {
      icon: 'mdi-check',
      tooltip: t('share.linkCopied'),
      color: 'success',
    }
  } catch (err) {
    console.error('Failed to copy: ', err)
    state.value = {
      icon: 'mdi-close',
      tooltip: t('share.linkCopyFailed'),
      color: 'error',
    }
  }
  delayedResetCopyState()
}

function selectEmbedUrl() {
  field.value?.select()
}
</script>
