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

const splashSrc = asyncComputed(async () => {
  if (!configStore.general.splashScreen) return
  const localPath = `${imagesBaseUrl}${configStore.general.splashScreen}`
  const remoteResource = configStore.general.splashScreen
  return await getLocalOrRemoteFileUrl(localPath, remoteResource)
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
