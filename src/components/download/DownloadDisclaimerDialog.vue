<template>
  <v-dialog
    :model-value="store.isVisible"
    max-width="600"
    persistent
    scrollable
    @update:model-value="(value: boolean) => !value && store.decline()"
  >
    <v-card>
      <html-display class="px-4" :url="disclaimerUrl" />
      <v-card-actions class="justify-end">
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
import HtmlDisplay from '@/components/general/HtmlDisplay.vue'

const disclaimerUrl = `${import.meta.env.BASE_URL}download-disclaimer.html`

const { t } = useI18n()
const store = useDownloadDisclaimerStore()
</script>

<style scoped>
.download-disclaimer__content :deep(:first-child) {
  margin-top: 0;
}
</style>
