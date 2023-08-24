<template><div>Hello</div></template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager'

onMounted((): void => {
  authenticationManager.userManager.signinSilentCallback()
})

</script>
