<template>
  <TermsOfUseDialog v-if="shouldAgreeToTerms" v-model="showTermsDialog" />
  <SplashScreenDialog
    v-if="splashSrc && !showTermsDialog"
    v-model="showSplashDialog"
    :img-url="splashSrc"
    :version="packageConfig.version"
  />
</template>

<script setup lang="ts">
import SplashScreenDialog from '@/components/dialog/SplashScreenDialog.vue'
import TermsOfUseDialog from '@/components/dialog/TermsOfUseDialog.vue'
import packageConfig from '@/../package.json'
import { computed } from 'vue'
import { getLocalOrRemoteFileUrl } from '@/lib/fews-config'
import { useConfigStore } from '@/stores/config'
import { asyncComputed, useStorage } from '@vueuse/core'

const configStore = useConfigStore()

const imagesBaseUrl = `${import.meta.env.BASE_URL}images/`
const splashSrc = asyncComputed(
  async () =>
    await getLocalOrRemoteFileUrl(
      imagesBaseUrl,
      configStore.general.splashScreen,
    ),
)

const shouldAgreeToTerms = computed(
  () => configStore.general.agreeToTermsAndConditions?.enabled ?? false,
)

const showTermsDialog = useStorage(
  'weboc-show-agree-to-terms-v1.0.0',
  true,
  window.localStorage,
  { mergeDefaults: true, writeDefaults: false },
)

const showSplashDialog = useStorage(
  'weboc-splash-screen-v1.0.0',
  true,
  sessionStorage,
  { mergeDefaults: true, writeDefaults: false },
)
</script>
