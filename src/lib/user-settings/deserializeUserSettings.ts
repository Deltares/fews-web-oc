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

/** A user change as persisted in local storage. */
export interface StoredUserSetting {
  id: string
  value?: UserSettingsItem['value']
  favorite?: boolean
}

/**
 * Serializes only what the user changed with respect to `baseline` (the
 * built-in defaults with the FEWS config applied), so that later changes to
 * the defaults still reach the user.
 */
export function serializeUserSettings(
  items: UserSettingsItem[],
  baseline: UserSettingsItem[],
): string {
  const changes: StoredUserSetting[] = []
  for (const item of items) {
    if (item.disabled) continue
    const baseItem = baseline.find((b) => b.id === item.id)
    if (baseItem === undefined) continue

    // A stored value that is not available yet (e.g. a base map that is still
    // loading) is kept until the option list has been updated.
    const value =
      item.type === 'oneOfMultiple'
        ? (item.initialStorageValue ?? item.value)
        : item.value

    const change: StoredUserSetting = { id: item.id }
    if (value !== baseItem.value) change.value = value
    if (Boolean(item.favorite) !== Boolean(baseItem.favorite)) {
      change.favorite = Boolean(item.favorite)
    }
    if (Object.keys(change).length > 1) changes.push(change)
  }
  return JSON.stringify({ items: changes })
}

/**
 * Older versions stored a full copy of every setting. Keep only the fields
 * that differ from the built-in default, as those are the user's changes.
 */
function toStoredUserSetting(
  storedItem: Partial<UserSettingsItem>,
  defaultItem: UserSettingsItem,
): Partial<UserSettingsItem> {
  const isLegacyCopy = 'type' in storedItem
  if (!isLegacyCopy) return storedItem

  const change: Partial<UserSettingsItem> = { ...storedItem }
  if (storedItem.value === defaultItem.value) delete change.value
  if (Boolean(storedItem.favorite) === Boolean(defaultItem.favorite)) {
    delete change.favorite
  }
  return change
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

  for (const [index, item] of newState.entries()) {
    // Settings disabled in the FEWS config are not user-editable, so the
    // configured value takes precedence over the stored one.
    if (item.disabled) continue

    const rawStoredItem = storedItems.find((s) => s?.id === item.id)
    if (rawStoredItem === undefined) continue
    const storedItem = toStoredUserSetting(rawStoredItem, defaults[index])

    if (storedItem.value !== undefined) {
      if (item.type === 'oneOfMultiple') {
        resolveOneOfMultipleValue(item, storedItem)
      } else {
        item.value = storedItem.value as boolean
      }
    }

    if (storedItem.favorite !== undefined) {
      item.favorite = storedItem.favorite as boolean
    }
  }

  return newState
}
