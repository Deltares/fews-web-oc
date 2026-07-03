import { Type, type Static } from '@sinclair/typebox'

export const DefaultUserSettingValueSchema = Type.Union([
  Type.String(),
  Type.Boolean(),
])

const ScrollZoomModeValueSchema = Type.Union([
  Type.Literal('off'),
  Type.Literal('x'),
  Type.Literal('y'),
  Type.Literal('xy'),
])

const DisplayUnitsValueSchema = Type.Union([
  Type.Literal('system'),
  Type.Literal('display'),
])

const HierarchicalMenuStyleValueSchema = Type.Union([
  Type.Literal('auto'),
  Type.Literal('tree'),
  Type.Literal('column'),
])

const DefaultUserSettingItemSchema = Type.Object(
  {
    value: Type.String(),
    title: Type.String(),
    disabled: Type.Optional(Type.Boolean()),
    icon: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingOverrideSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    value: Type.Optional(DefaultUserSettingValueSchema),
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingHierarchicalMenuStyleOverrideSchema = Type.Object(
  {
    id: Type.Literal('ui.hierarchical-menu-style'),
    value: Type.Optional(HierarchicalMenuStyleValueSchema),
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingDisplayUnitsOverrideSchema = Type.Object(
  {
    id: Type.Literal('units.displayUnits'),
    value: Type.Optional(DisplayUnitsValueSchema),
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingScrollZoomModeOverrideSchema = Type.Object(
  {
    id: Type.Literal('charts.scrollZoomMode'),
    value: Type.Optional(ScrollZoomModeValueSchema),
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingGroupSchema = Type.Union([
  Type.Literal('Charts'),
  Type.Literal('Units'),
  Type.Literal('Map'),
  Type.Literal('UI'),
  Type.Literal('Datum'),
])

const DefaultUserSettingBooleanSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    type: Type.Literal('boolean'),
    label: Type.String({ minLength: 1 }),
    value: Type.Boolean(),
    group: DefaultUserSettingGroupSchema,
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingOneOfMultipleSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    type: Type.Literal('oneOfMultiple'),
    label: Type.String({ minLength: 1 }),
    value: Type.String(),
    items: Type.Array(DefaultUserSettingItemSchema, { minItems: 1 }),
    group: DefaultUserSettingGroupSchema,
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingHierarchicalMenuStyleSchema = Type.Object(
  {
    id: Type.Literal('ui.hierarchical-menu-style'),
    type: Type.Literal('oneOfMultiple'),
    label: Type.String({ minLength: 1 }),
    value: HierarchicalMenuStyleValueSchema,
    items: Type.Array(DefaultUserSettingItemSchema, { minItems: 1 }),
    group: Type.Literal('UI'),
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingDisplayUnitsSchema = Type.Object(
  {
    id: Type.Literal('units.displayUnits'),
    type: Type.Literal('oneOfMultiple'),
    label: Type.String({ minLength: 1 }),
    value: DisplayUnitsValueSchema,
    items: Type.Array(DefaultUserSettingItemSchema, { minItems: 1 }),
    group: Type.Literal('Units'),
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

const DefaultUserSettingScrollZoomModeSchema = Type.Object(
  {
    id: Type.Literal('charts.scrollZoomMode'),
    type: Type.Literal('oneOfMultiple'),
    label: Type.String({ minLength: 1 }),
    value: ScrollZoomModeValueSchema,
    items: Type.Array(DefaultUserSettingItemSchema, { minItems: 1 }),
    group: Type.Literal('Charts'),
    enabled: Type.Optional(Type.Boolean()),
    favorite: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

export const DefaultUserSettingSchema = Type.Union([
  DefaultUserSettingOverrideSchema,
  DefaultUserSettingDisplayUnitsOverrideSchema,
  DefaultUserSettingHierarchicalMenuStyleOverrideSchema,
  DefaultUserSettingScrollZoomModeOverrideSchema,
  DefaultUserSettingBooleanSchema,
  DefaultUserSettingOneOfMultipleSchema,
  DefaultUserSettingDisplayUnitsSchema,
  DefaultUserSettingHierarchicalMenuStyleSchema,
  DefaultUserSettingScrollZoomModeSchema,
])

export const DefaultUserSettingsObjectSchema = Type.Object(
  {
    $schema: Type.Optional(Type.String()),
    settings: Type.Array(DefaultUserSettingSchema),
  },
  { additionalProperties: false },
)

export const DefaultUserSettingsSchema = Type.Union([
  Type.Array(DefaultUserSettingSchema),
  DefaultUserSettingsObjectSchema,
])

export type DefaultUserSetting = Static<typeof DefaultUserSettingSchema>
export type DefaultUserSettings = Static<typeof DefaultUserSettingsSchema>
