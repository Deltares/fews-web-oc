import { ref, onMounted, computed } from 'vue'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.js'
import type { User } from 'oidc-client-ts'

export function useCurrentUser() {
  const user = ref<User | null>(null)

  const userName = computed(
    () => user.value?.profile?.name ?? 'Current User',
  )

  const fetchCurrentUser = async () => {
    try {
      user.value = await authenticationManager.userManager.getUser()
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  onMounted(() => {
    fetchCurrentUser()
  })

  return {
    user,
    userName,
    fetchCurrentUser,
  }
}
