<template>Redirecting after logout</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import {
  authenticationManager,
  OidcAuthManager,
} from '@/services/authentication'
import { configManager } from '@/services/application-config'
import { useConfigStore } from '../../stores/config.ts'

onMounted((): void => {
  if (configManager.authType !== 'oidc') {
    window.location.href = import.meta.env.BASE_URL + 'login'
    return
  }
  const oidcManager = authenticationManager as unknown as OidcAuthManager
  oidcManager.userManager
    .signoutRedirectCallback()
    .then(() => {
      const store = useConfigStore()
      store.$reset()
    })
    .catch((err) => console.error(err))
    .finally(() => (window.location.href = import.meta.env.BASE_URL + 'login'))
})
</script>
