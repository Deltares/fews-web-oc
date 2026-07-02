import { Type, type Static } from '@sinclair/typebox'

export const DefaultUserSettingValueSchema = Type.Union([Type.String(), Type.Boolean()])

export const DefaultUserSettingSchema = Type.Object(
  {
    id: Type.String(),
    value: DefaultUserSettingValueSchema,
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false }
)

export const DefaultUserSettingsSchema = Type.Object(
  {
    $schema: Type.Optional(Type.String()),
    settings: Type.Array(DefaultUserSettingSchema),
  },
  { additionalProperties: false }
)

export type DefaultUserSetting = Static<typeof DefaultUserSettingSchema>
export type DefaultUserSettings = Static<typeof DefaultUserSettingsSchema>
