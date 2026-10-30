import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { configManager } from '@/services/application-config'

const STORAGE_KEY = 'weboc-configurator-mode-v1.0.0'

/**
 * Whether the configurator mode may be enabled.
 *
 * It is always allowed in development builds, in other builds it has to be
 * allowed in the application config.
 */
export function isConfiguratorModeAllowed(): boolean {
  if (import.meta.env.DEV) return true
  // Values from the environment are strings, values from app-config.json can
  // be booleans.
  const allowed = configManager.get('VITE_FEWS_WEBOC_CONFIGURATOR_MODE_ALLOWED')
  return allowed === true || String(allowed).toLowerCase() === 'true'
}

/**
 * Configurator mode shows system details that help a configurator understand
 * the FEWS configuration, and that are not relevant for general users.
 *
 * Note that this only affects what is shown; the details are still part of the
 * web service responses.
 */
export const useConfiguratorModeStore = defineStore(
  'configuratorMode',
  () => {
    const isAllowed = ref(isConfiguratorModeAllowed())
    // The choice of the user, only effective when the mode is allowed.
    const enabledByUser = ref(false)

    const isEnabled = computed(() => isAllowed.value && enabledByUser.value)

    function setEnabled(enabled: boolean): void {
      enabledByUser.value = enabled
    }

    function toggle(): void {
      setEnabled(!enabledByUser.value)
    }

    return { isAllowed, enabledByUser, isEnabled, setEnabled, toggle }
  },
  {
    persist: {
      key: STORAGE_KEY,
      storage: window.localStorage,
      pick: ['enabledByUser'],
    },
  },
)
