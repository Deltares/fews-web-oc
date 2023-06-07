export const UserSettingsType = {
  oneOfMultiple: 'oneOfMultiple',
} as const

export type UserSettingsType = (typeof UserSettingsType)[keyof typeof UserSettingsType];

export interface UserSettingsWithIcon {
  value: string;
  icon?: string;
}

export interface UserSettingsItem {
  type: UserSettingsType;
  label: string;
  value: string;
  items: string[] | UserSettingsWithIcon[];
  favorite?: boolean;
  group: string;
}

export interface UserSettingsState {
  settings: UserSettingsItem[]
  groups: string[]
}
