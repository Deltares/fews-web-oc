import { ref, onMounted } from 'vue'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.js'
import type { User } from 'oidc-client-ts'

export function useCurrentUser() {
  const currentUser = ref<User | null>(null)

  const fetchCurrentUser = async () => {
    try {
      currentUser.value = await authenticationManager.userManager.getUser()
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  onMounted(() => {
    fetchCurrentUser()
  })

  return {
    currentUser,
    fetchCurrentUser,
  }
}
