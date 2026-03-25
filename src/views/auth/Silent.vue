<script setup lang="ts">
import { onMounted } from 'vue'
import {
  authenticationManager,
  OidcAuthManager,
} from '@/services/authentication'

onMounted((): void => {
  const oidcManager = authenticationManager as unknown as OidcAuthManager
  oidcManager.userManager.signinSilentCallback()
})
</script>
