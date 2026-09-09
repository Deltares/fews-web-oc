<template>
  <v-btn
    :icon="state.icon"
    :color="state.color"
    :disabled="disabled"
    v-tooltip:bottom="state.tooltip"
    @click.stop="copyToClipboard"
    density="comfortable"
    aria-label="Copy to clipboard"
  >
    <v-icon size="small">{{ state.icon }}</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  url: string
  disabled?: boolean
}
const props = defineProps<Props>()

const { t } = useI18n()

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
</script>
