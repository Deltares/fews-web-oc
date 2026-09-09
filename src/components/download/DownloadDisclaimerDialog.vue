<template>
  <v-dialog
    :model-value="store.isVisible"
    max-width="80%"
    width="800"
    persistent
    scrollable
    @update:model-value="(value) => !value && store.decline()"
  >
    <v-card :loading="store.isLoading">
      <v-card-text class="py-0">
        <pre>{{ store.text }}</pre>
        <v-alert v-if="store.error" type="error" class="mt-2">{{
          store.error
        }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="!store.isLoading && !store.error"
          prepend-icon="mdi-download"
          :href="store.url"
          download="DISCLAIMER.txt"
          :text="t('download.disclaimer.download')"
        />
        <v-spacer />
        <v-btn @click="store.decline()" :text="t('common.cancel')" />
        <v-btn
          variant="flat"
          color="primary"
          @click="store.accept()"
          :text="t('download.disclaimer.accept')"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDownloadDisclaimerStore } from '@/stores/downloadDisclaimer'

const { t } = useI18n()
const store = useDownloadDisclaimerStore()
</script>
