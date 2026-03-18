<template>Redirecting after logout</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager'
import { configManager } from '../../services/application-config'
import { useConfigStore } from '../../stores/config.ts'

onMounted((): void => {
  if (configManager.authType !== 'oidc') {
    window.location.href = import.meta.env.BASE_URL + 'login'
    return
  }
  authenticationManager.userManager
    .signoutRedirectCallback()
    .then(() => {
      const store = useConfigStore()
      store.$reset()
    })
    .catch((err) => console.error(err))
    .finally(() => (window.location.href = import.meta.env.BASE_URL + 'login'))
})
</script>
