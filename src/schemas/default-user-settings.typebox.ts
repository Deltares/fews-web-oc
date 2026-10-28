import { Type, type Static, type TSchema } from 'typebox'
// Relative import with attribute, so `npm run compile-schemas` can run in Node.
import userSettingDefinitions from '../assets/DefaultUserSettings.json' with { type: 'json' }

interface UserSettingDefinition {
  id: string
  type: 'boolean' | 'oneOfMultiple'
  label: string
  items?: { value: string }[]
}

// Options of these settings are replaced at runtime, e.g. base maps from the
// FEWS map layer config, so any value is allowed.
const runtimeOptionSettings = new Set(['ui.map.theme'])

function valueSchema(definition: UserSettingDefinition): TSchema {
  if (definition.type === 'boolean') {
    return Type.Boolean({ description: 'Default value: true or false.' })
  }
  const values = definition.items?.map((item) => item.value) ?? []
  if (runtimeOptionSettings.has(definition.id) || values.length === 0) {
    return Type.String({ description: 'Default value.' })
  }
  return Type.Union(
    values.map((value) => Type.Literal(value)),
    { description: `Default value: ${values.join(', ')}.` },
  )
}

function overrideSchema(definition: UserSettingDefinition) {
  return Type.Object(
    {
      id: Type.Literal(definition.id),
      value: Type.Optional(valueSchema(definition)),
      enabled: Type.Optional(
        Type.Boolean({
          description:
            'Whether users can see and change the setting. When false, the configured value applies to everyone.',
        }),
      ),
      favorite: Type.Optional(
        Type.Boolean({
          description: 'Show the setting in the user settings menu by default.',
        }),
      ),
    },
    {
      additionalProperties: false,
      title: definition.label,
      description: `Override for the "${definition.label}" user setting.`,
    },
  )
}

const definitions = userSettingDefinitions as UserSettingDefinition[]

/** Override schema for each built-in user setting, by setting id. */
export const DefaultUserSettingSchemas = Object.fromEntries(
  definitions.map((definition) => [definition.id, overrideSchema(definition)]),
)

export const DefaultUserSettingSchema = Type.Union(
  Object.values(DefaultUserSettingSchemas),
)

/**
 * Schema of `WebResourceFiles/default-user-settings.json` in the FEWS config,
 * compiled to `schemas/default-user-settings.schema.json`. WebOC also accepts
 * a bare array of overrides.
 */
export const DefaultUserSettingsSchema = Type.Object(
  {
    $schema: Type.Optional(Type.String()),
    settings: Type.Array(DefaultUserSettingSchema, {
      description: 'Overrides of the WebOC default user settings.',
    }),
  },
  {
    additionalProperties: false,
    title: 'WebOC default user settings',
    description:
      'Overrides of the WebOC default user settings, placed in WebResourceFiles/default-user-settings.json.',
  },
)

// The union is built from a runtime list, so derive the entry type from one
// override schema: { id: string, value?: unknown, enabled?, favorite? }.
export type DefaultUserSetting = Static<ReturnType<typeof overrideSchema>>
export type DefaultUserSettings =
  DefaultUserSetting[] | { $schema?: string; settings: DefaultUserSetting[] }
