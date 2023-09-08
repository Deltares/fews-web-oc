<template>Redirecting after logout</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager'
import { useConfigStore } from '../../stores/config.ts'

onMounted((): void => {
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
