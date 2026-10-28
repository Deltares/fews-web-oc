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

function isValidValueForItem(item: UserSettingsItem, value: unknown): boolean {
  if (item.type === 'boolean') return typeof value === 'boolean'
  return (
    typeof value === 'string' &&
    (item.items?.some((i) => i.value === value) ?? false)
  )
}

function applyWebResourcesOverrides(
  state: UserSettingsItem[],
  overrides: UserSettingsOverride[],
): void {
  for (const item of state) {
    const override = overrides.find((o) => o.id === item.id)
    if (override === undefined) continue

    if (override.value !== undefined) {
      if (isValidValueForItem(item, override.value)) {
        item.value = override.value as UserSettingsItem['value']
      } else {
        console.warn(
          `Ignoring invalid default value ${JSON.stringify(override.value)} for user setting "${item.id}".`,
        )
      }
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

// The persisted state is serialized as `{ items: [...] }`.
function parseStoredItems(data: string): Partial<UserSettingsItem>[] {
  try {
    const parsed: unknown = JSON.parse(data)
    const items = Array.isArray(parsed)
      ? parsed
      : (parsed as { items?: unknown } | null)?.items
    return Array.isArray(items) ? items : []
  } catch {
    console.warn(
      'Failed to parse user settings from local storage, using defaults.',
    )
    return []
  }
}

export function deserializeUserSettings(
  data: string,
  defaults: UserSettingsItem[],
  webResourcesOverrides: UserSettingsOverride[] = [],
): UserSettingsItem[] {
  const storedItems = parseStoredItems(data)

  const newState: UserSettingsItem[] = defaults.map((item) => ({ ...item }))

  applyWebResourcesOverrides(newState, webResourcesOverrides)

  for (const item of newState) {
    // Settings disabled in the FEWS config are not user-editable, so the
    // configured value takes precedence over the stored one.
    if (item.disabled) continue

    const storedItem = storedItems.find((s) => s?.id === item.id)
    if (storedItem === undefined) continue

    if (item.type === 'oneOfMultiple') {
      resolveOneOfMultipleValue(item, storedItem)
    } else if (storedItem.value !== undefined) {
      item.value = storedItem.value as boolean
    }

    if (storedItem.favorite !== undefined) {
      item.favorite = storedItem.favorite as boolean
    }
  }

  return newState
}
