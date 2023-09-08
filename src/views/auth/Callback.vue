<template>Redirecting after logout</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager'
import { useRouter } from 'vue-router'

onMounted(async () => {
  const router = useRouter()
  const user = await authenticationManager.userManager.signinRedirectCallback()
  const path: string = user.state === null ? '/about' : (user.state as string)
  router.push({ path })
})
</script>
