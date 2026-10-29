import { h } from 'vue'
import { VThemeProvider } from 'vuetify/components'
import DateTimeSlider from './DateTimeSlider.vue'

// Hourly dates over two weeks
const dates = Array.from(
  { length: 14 * 24 },
  (_, i) => new Date(Date.UTC(2025, 0, 1, i)),
)

// Hourly local dates over three days starting at noon, so that hour ticks
// come before the first day boundary
const noonDates = Array.from(
  { length: 3 * 24 },
  (_, i) => new Date(2025, 0, 1, 12 + i),
)

const story =
  (width: number, storyDates = dates) =>
  () =>
    h('div', { style: `padding-top: 120px; width: ${width}px` }, [
      h(DateTimeSlider, {
        dates: storyDates,
        selectedDate: storyDates[10],
        doFollowNow: false,
      }),
    ])

export const ExtraWide = story(2000)
export const Wide = story(1000)
export const Narrow = story(360)
export const NarrowFromNoon = story(360, noonDates)
export const WideDark = () =>
  h(VThemeProvider, { theme: 'dark', withBackground: true }, story(1000))

// Floating panel as in the spatial display, with the thumb at the start so it
// sits in the rounded corner
const floating = (width: number, cornerRadius: number, phone: boolean) => () =>
  h('div', { style: `padding: 120px 5px 5px; width: ${width}px` }, [
    h(DateTimeSlider, {
      dates,
      selectedDate: dates[0],
      doFollowNow: false,
      hideSpeedControls: phone,
      'data-testid': 'floating-panel',
      style: {
        '--datetime-slider-corner-radius': `${cornerRadius}px`,
        backgroundColor: 'rgba(var(--v-theme-surface), 0.8)',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
      },
    }),
  ])

export const FloatingDesktop = floating(1000, 15, false)
export const FloatingPhone = floating(390, 50, true)
