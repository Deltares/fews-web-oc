import { ref, onMounted, computed } from 'vue'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.js'
import type { User } from 'oidc-client-ts'

export function useCurrentUser() {
  const user = ref<User | null>(null)

  const userName = computed(() => user.value?.profile?.name ?? 'Current User')
  const preferredUsername = computed(
    () =>
      user.value?.profile?.preferred_username ??
      'Current User Preferred Username',
  )
  const userEmail = computed(
    () => user.value?.profile?.email ?? 'Current User Email',
  )

  const fetchCurrentUser = async () => {
    try {
      user.value = await authenticationManager.getUser()
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
    preferredUsername,
    userEmail,
    fetchCurrentUser,
  }
}
