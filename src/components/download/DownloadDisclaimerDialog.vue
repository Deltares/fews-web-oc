<template>
  <v-dialog
    :model-value="store.isVisible"
    max-width="80%"
    width="800"
    persistent
    scrollable
    @update:model-value="(value: boolean) => !value && store.decline()"
  >
    <v-card :loading="isLoading">
      <v-card-text class="py-0">
        <pre>{{ txt }}</pre>
        <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn icon="mdi-download" :href="url" download="DISCLAIMER.txt" />
        <v-btn @click="store.decline()">{{ t('common.cancel') }}</v-btn>
        <v-btn variant="flat" color="primary" @click="store.accept()">
          {{ t('download.disclaimer.accept') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDownloadDisclaimerStore } from '@/stores/downloadDisclaimer'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { onMounted, ref } from 'vue'

const url = getResourcesStaticUrl('download-disclaimer.txt')

const txt = ref<string>()
const error = ref<string>()
const isLoading = ref<boolean>(true)

async function fetchDisclaimer() {
  try {
    const response = await fetch(url)
    if (response.ok) {
      txt.value = await response.text()
    } else {
      error.value = `Failed to load disclaimer: ${response.status} ${response.statusText}`
    }
  } catch (e) {
    console.error('Error fetching disclaimer:', e)
    error.value = 'Failed to load disclaimer.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDisclaimer()
})

const { t } = useI18n()
const store = useDownloadDisclaimerStore()
</script>
