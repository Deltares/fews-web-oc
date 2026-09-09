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
      <v-card-text class="py-0 text-pre-wrap">
        <pre class="text-body-small text-pre-wrap">{{ store.text }}</pre>
        <v-alert v-if="store.error" type="error" class="mt-2">{{
          store.error
        }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <a
          v-if="!store.isLoading && !store.error"
          :href="store.url"
          class="ms-4 text-label-medium"
          target="_blank"
          text="data-usage-agreement.txt"
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
