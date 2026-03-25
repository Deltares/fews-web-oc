import { ref, onMounted, computed } from 'vue'
import { authenticationManager, type AuthUser } from '@/services/authentication'

export function useCurrentUser() {
  const user = ref<AuthUser | null>(null)

  const userName = computed(() => user.value?.name ?? 'Current User')
  const preferredUsername = computed(
    () => user.value?.preferredUsername ?? 'Current User Preferred Username',
  )
  const userEmail = computed(() => user.value?.email ?? 'Current User Email')

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
