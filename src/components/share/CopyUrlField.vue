<template>
  <div class="d-flex flex-column ga-4">
    <div>
      <v-tabs v-model="tab">
        <v-tab
          value="link"
          :text="t('share.link')"
          prepend-icon="mdi-link-variant"
        />
        <v-tab
          value="iframe"
          :text="t('share.iframe')"
          prepend-icon="mdi-code-tags"
        />
      </v-tabs>
      <v-divider />
    </div>

    <v-text-field
      :model-value="displayValue"
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

    <div v-if="tab === 'iframe'" class="d-flex ga-2">
      <v-number-input
        v-model.number="iframeWidth"
        :min="1"
        label="Width"
        density="compact"
        hide-details
        control-variant="stacked"
        variant="outlined"
      />
      <v-number-input
        v-model.number="iframeHeight"
        :min="1"
        label="Height"
        density="compact"
        hide-details
        control-variant="stacked"
        variant="outlined"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef, watch } from 'vue'
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

const tab = ref<'link' | 'iframe'>('link')
const iframeWidth = ref(600)
const iframeHeight = ref(400)

const displayValue = computed(() => {
  switch (tab.value) {
    case 'link':
      return props.url
    case 'iframe':
      return `<iframe src="${props.url}" width="${iframeWidth.value}" height="${iframeHeight.value}" frameborder="0" allowfullscreen></iframe>`
  }
})

watch(tab, () => {
  resetCopyState()
})

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
    await navigator.clipboard.writeText(displayValue.value)
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
