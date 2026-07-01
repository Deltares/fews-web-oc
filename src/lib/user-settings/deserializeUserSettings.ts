import type {
  UserSettingsItem,
  UserSettingsItemOneOf,
  UserSettingsWithIcon,
} from '@/stores/userSettings'

export interface UserSettingsOverride {
  id: string
  value?: unknown
  enabled?: boolean
  favorite?: boolean
}

const ALLOWED_OVERRIDE_KEYS = new Set<string>([
  'id',
  'value',
  'enabled',
  'favorite',
])

export function isValidUserSettingsOverride(
  override: unknown,
): override is UserSettingsOverride {
  if (typeof override !== 'object' || override === null) return false
  const obj = override as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length === 0) return false

  for (const key of Object.keys(obj)) {
    if (!ALLOWED_OVERRIDE_KEYS.has(key)) return false
  }

  if ('enabled' in obj && typeof obj.enabled !== 'boolean') return false
  if ('favorite' in obj && typeof obj.favorite !== 'boolean') return false

  return true
}

export function filterValidOverrides(
  overrides: unknown[],
): UserSettingsOverride[] {
  return overrides.filter(isValidUserSettingsOverride)
}

function applyWebResourcesOverrides(
  state: UserSettingsItem[],
  overrides: UserSettingsOverride[],
): void {
  for (const item of state) {
    const override = overrides.find((o) => o.id === item.id)
    if (override === undefined) continue

    if (override.value !== undefined) {
      item.value = override.value as UserSettingsItem['value']
    }
    if (override.enabled !== undefined) {
      item.disabled = !override.enabled
    }
    if (override.favorite !== undefined) {
      item.favorite = override.favorite
    }
  }
}

function resolveOneOfMultipleValue(
  item: UserSettingsItemOneOf,
  storedItem: Partial<UserSettingsItem>,
): void {
  const currentValues =
    item.items?.map((i: UserSettingsWithIcon) => i.value) ?? []
  if (currentValues.includes(storedItem.value as string)) {
    item.value = storedItem.value as string
    return
  }

  const index = (storedItem as UserSettingsItemOneOf).items?.findIndex(
    (i: UserSettingsWithIcon) => i.value === storedItem.value,
  )
  const newValue = item.items?.[index ?? -1]?.value
  if (newValue !== undefined) {
    item.value = newValue
  }
  item.initialStorageValue = storedItem.value as string
}

export function deserializeUserSettings(
  data: string,
  defaults: UserSettingsItem[],
  webResourcesOverrides: UserSettingsOverride[] = [],
): UserSettingsItem[] {
  let parsedState: { items?: Partial<UserSettingsItem>[] } = {}
  try {
    parsedState = JSON.parse(data)
  } catch {}

  const newState: UserSettingsItem[] = defaults.map((item) => ({ ...item }))

  applyWebResourcesOverrides(newState, webResourcesOverrides)

  const storedItems: Partial<UserSettingsItem>[] = parsedState.items ?? []
  for (const item of newState) {
    const storedItem = storedItems.find((s) => s.id === item.id)
    if (storedItem === undefined) continue

    if (item.type === 'oneOfMultiple') {
      resolveOneOfMultipleValue(item, storedItem)
    } else {
      item.value = storedItem.value as boolean
    }

    item.favorite = storedItem.favorite as boolean
  }

  return newState
}
