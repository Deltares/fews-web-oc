export const UserSettingsType = {
  oneOfMultiple: 'oneOfMultiple',
} as const

export type UserSettingsType = (typeof UserSettingsType)[keyof typeof UserSettingsType];

export interface UserSettingsWithIcon {
  value: string;
  icon?: string;
}

export interface UserSettingsItem {
  id: string;
  type: UserSettingsType;
  label: string;
  value: string;
  items: UserSettingsWithIcon[];
  favorite?: boolean;
  group: string;
}

export interface UserSettingsState {
  byId: Record<string, UserSettingsItem>;
  allIds: string[];
  groups: string[];
}
