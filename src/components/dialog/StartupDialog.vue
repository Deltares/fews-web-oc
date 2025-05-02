<template>
  <TermsOfUseDialog
    v-if="shouldAgreeToTerms && showTermsDialog"
    v-model="showTermsDialog"
  />
  <SplashScreenDialog
    v-else-if="splashSrc"
    v-model="showSplashDialog"
    :img-url="splashSrc"
    :version="packageConfig.version"
    data-testid="fews-splash-screen"
  />
</template>

<script setup lang="ts">
import SplashScreenDialog from '@/components/dialog/SplashScreenDialog.vue'
import TermsOfUseDialog from '@/components/dialog/TermsOfUseDialog.vue'
import packageConfig from '@/../package.json'
import { computed } from 'vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useConfigStore } from '@/stores/config'
import { asyncComputed, useStorage } from '@vueuse/core'

const configStore = useConfigStore()

const splashSrc = asyncComputed(async () => {
  if (!configStore.general.splashScreen) return

  return getResourcesStaticUrl(configStore.general.splashScreen)
})

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
