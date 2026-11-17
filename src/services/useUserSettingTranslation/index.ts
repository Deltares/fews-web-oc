import { useI18n } from 'vue-i18n'
import type {
  UserSettingsGroup,
  UserSettingsItem,
  UserSettingsWithIcon,
} from '@/stores/userSettings'

const itemsKey = 'userSettings.items'
const groupsKey = 'userSettings.groups'

/**
 * Translates user setting labels, option titles and group titles.
 *
 * Keys follow the setting id, e.g. `userSettings.items.charts.brush.label` and
 * `userSettings.items.charts.scrollZoomMode.options.xy`. Without a translation
 * the text from the setting definition (English) is used, e.g. for option
 * values containing dots (`ui.scale`) or options added at runtime (base maps).
 * Option titles set in the FEWS config are used as is.
 */
export function useUserSettingTranslation() {
  const { t, te } = useI18n()

  function translate(key: string, fallback: string): string {
    return te(key) ? t(key) : fallback
  }

  function label(item: Pick<UserSettingsItem, 'id' | 'label'>): string {
    return translate(`${itemsKey}.${item.id}.label`, item.label)
  }

  function optionTitle(
    item: Pick<UserSettingsItem, 'id'>,
    option: Pick<UserSettingsWithIcon, 'value' | 'title' | 'configuredTitle'>,
  ): string {
    if (option.configuredTitle) return option.title
    return translate(
      `${itemsKey}.${item.id}.options.${option.value}`,
      option.title,
    )
  }

  function groupTitle(group: Pick<UserSettingsGroup, 'id' | 'title'>): string {
    return translate(`${groupsKey}.${group.id}`, group.title)
  }

  return { label, optionTitle, groupTitle }
}
