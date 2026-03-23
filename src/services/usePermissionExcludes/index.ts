import { computed, readonly, ref, watch } from 'vue'
import { Permission, PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { configManager } from '../application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

const STORAGE_KEY = 'weboc-permission-excludes'
const FAVORITES_KEY = 'weboc-permission-favorites'

function loadFromStorage(key: string): string[] {
  const stored = window.localStorage.getItem(key)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const permissions = ref<Permission[]>([])
const excludedPermissions = ref<string[]>(loadFromStorage(STORAGE_KEY))
const favoritePermissions = ref<string[]>(loadFromStorage(FAVORITES_KEY))

watch(
  excludedPermissions,
  (value) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

watch(
  favoritePermissions,
  (value) => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(value))
  },
  { deep: true },
)

export const permissionsKey = computed(() => excludedPermissions.value.join(','))

export default function usePermissionExcludes() {
  function togglePermission(permissionId: string, included: boolean) {
    if (included) {
      excludedPermissions.value = excludedPermissions.value.filter(
        (perm) => perm !== permissionId,
      )
    } else {
      excludedPermissions.value.push(permissionId)
    }
  }

  function isEnabled(permissionId: string): boolean {
    return !excludedPermissions.value.includes(permissionId)
  }

  function toggleFavorite(permissionId: string) {
    const index = favoritePermissions.value.indexOf(permissionId)
    if (index >= 0) {
      favoritePermissions.value.splice(index, 1)
    } else {
      favoritePermissions.value.push(permissionId)
    }
  }

  function isFavorite(permissionId: string): boolean {
    return favoritePermissions.value.includes(permissionId)
  }

  const favoritePermissionsList = computed(() =>
    permissions.value.filter((p) => favoritePermissions.value.includes(p.id)),
  )

  async function loadPermissions() {
    if (permissions.value.length === 0) {
      const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
      const piProvider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      // note: piProvider getPermissions should be called without excluded
      // permissions. Since this code only runs when this composable is first
      // called, we assume that excludedPermissions is empty.
      const result = await piProvider.getPermissions()
      permissions.value = result.permissions?.filter((p) => {
        console.log(p)
        return p.assigned
      }) ?? []
    }
  }

  loadPermissions()
  return {
    permissions,
    excludedPermissions: readonly(excludedPermissions),
    togglePermission,
    isEnabled,
    toggleFavorite,
    isFavorite,
    favoritePermissionsList,
  }
}

export function getPermissionExcludesHeader(): Headers {
  const headerValue = excludedPermissions.value.join(',')
  if (headerValue.length == 0) {
    return new Headers({})
  }
  return new Headers({ 'fews-ws-permissions-excludes': headerValue })
}
