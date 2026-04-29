<template>
  <v-text-field
    :model-value="url"
    readonly
    hide-details
    density="compact"
    ref="field"
    @focus="selectEmbedUrl"
    :disabled="!url"
  >
    <template #append>
      <v-btn
        :icon="state.icon"
        :color="state.color"
        v-tooltip:bottom="state.tooltip"
        @click.stop="copyToClipboard"
        density="comfortable"
      />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  url?: string
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

function delayedResetCopyState() {
  setTimeout(() => {
    state.value = { ...initialState }
  }, 3000)
}

async function copyToClipboard() {
  if (!props.url) return
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
