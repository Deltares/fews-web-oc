<template>
  <div v-if="store.isConfigured" class="d-flex align-center">
    <v-checkbox
      v-model="store.hasAccepted"
      :label="t('download.disclaimer.acceptCheckbox')"
      hide-details
      density="comfortable"
    />
    <v-btn
      icon="mdi-information-outline"
      variant="text"
      size="small"
      :aria-label="t('download.disclaimer.viewDisclaimer')"
      @click="store.showDisclaimer()"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDownloadDisclaimerStore } from '@/stores/downloadDisclaimer'

const { t } = useI18n()
const store = useDownloadDisclaimerStore()
</script>
