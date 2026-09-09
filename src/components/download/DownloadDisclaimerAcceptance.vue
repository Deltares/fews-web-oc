<template>
  <v-card v-if="store.isConfigured" variant="tonal" class="d-flex align-center">
    <v-checkbox
      v-model="store.hasAccepted"
      :label="t('download.disclaimer.acceptText')"
      hide-details
      density="compact"
      class="flex-grow-1"
    />

    <v-btn
      icon="mdi-information-outline"
      variant="text"
      size="small"
      :aria-label="t('download.disclaimer.viewDisclaimer')"
      :title="t('download.disclaimer.viewDisclaimer')"
      @click="store.showDisclaimer()"
    />
  </v-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDownloadDisclaimerStore } from '@/stores/downloadDisclaimer'

const { t } = useI18n()
const store = useDownloadDisclaimerStore()
</script>
