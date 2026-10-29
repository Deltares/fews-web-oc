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

// Options of these settings can be any value, e.g. IANA time zones, so the
// FEWS config can add options that are not built in.
const openOptionSettings = new Set(['ui.timeZone'])

function optionValueSchema(
  definition: UserSettingDefinition,
  description: string,
): TSchema {
  const values = definition.items?.map((item) => item.value) ?? []
  if (
    runtimeOptionSettings.has(definition.id) ||
    openOptionSettings.has(definition.id) ||
    values.length === 0
  ) {
    return Type.String({ description: `${description}.` })
  }
  return Type.Union(
    values.map((value) => Type.Literal(value)),
    { description: `${description}: ${values.join(', ')}.` },
  )
}

function valueSchema(definition: UserSettingDefinition): TSchema {
  if (definition.type === 'boolean') {
    return Type.Boolean({ description: 'Default value: true or false.' })
  }
  return optionValueSchema(definition, 'Default value')
}

function itemsSchema(definition: UserSettingDefinition) {
  return Type.Array(
    Type.Object(
      {
        value: optionValueSchema(definition, 'Value of the option'),
        title: Type.Optional(
          Type.String({
            description:
              'Name of the option. Defaults to the built-in name, or the value.',
          }),
        ),
        icon: Type.Optional(
          Type.String({ description: 'Material Design icon, e.g. mdi-earth.' }),
        ),
        abbreviation: Type.Optional(
          Type.String({ description: 'Short text shown instead of an icon.' }),
        ),
      },
      { additionalProperties: false },
    ),
    {
      minItems: 1,
      description:
        'Options users can choose from, replacing the built-in options. The default value must be one of them; when omitted, the first option is the default.',
    },
  )
}

/** Whether the FEWS config can replace the options of the setting. */
function hasConfigurableItems(definition: UserSettingDefinition): boolean {
  return (
    definition.type === 'oneOfMultiple' &&
    !runtimeOptionSettings.has(definition.id)
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
      ...(hasConfigurableItems(definition)
        ? { items: Type.Optional(itemsSchema(definition)) }
        : {}),
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

/** An option of a setting in the FEWS config, see `itemsSchema`. */
export interface DefaultUserSettingOption {
  value: string
  title?: string
  icon?: string
  abbreviation?: string
}

// The union is built from a runtime list, so derive the entry type from one
// override schema: { id: string, value?: unknown, enabled?, favorite? }.
export type DefaultUserSetting = Omit<
  Static<ReturnType<typeof overrideSchema>>,
  'items'
> & { items?: DefaultUserSettingOption[] }
export type DefaultUserSettings =
  DefaultUserSetting[] | { $schema?: string; settings: DefaultUserSetting[] }
