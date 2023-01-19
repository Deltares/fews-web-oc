import { Vue, Component } from 'vue-property-decorator'
import { ColourTheme } from '@/lib/Theme'

@Component
export default class ThemeMixin extends Vue {
  theme = ColourTheme.Auto

  private mqDark: MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')

  created(): void {
    // Then listen for changes for user theme preferences.
    this.mqDark.addEventListener('change', this.setThemeFromMediaQueryEvent)
    // Make sure the theme is set correctly upon creation of this component.
    this.onThemeChange()
  }

  onThemeChange(): void {
    if (this.theme === ColourTheme.Auto) {
      this.setTheme(this.mqDark.matches)
    } else {
      this.setTheme(this.theme === ColourTheme.Dark)
    }
  }

  private setThemeFromMediaQueryEvent(event: MediaQueryListEvent): void {
    if (this.theme === ColourTheme.Auto) {
      this.setTheme(event.matches)
    }
  }

  private setTheme(isDark: boolean): void {
    this.$vuetify.theme.dark = isDark
    this.$forceUpdate()
    // Update wb-charts stylesheet such that charts also change to the selected theme.
    const css = document.getElementById('theme_css') as HTMLLinkElement
    if (css) {
      css.href = isDark ? `${process.env.BASE_URL}wb-charts-dark.css` : `${process.env.BASE_URL}wb-charts-light.css`
    }
  }
}
