import { h } from 'vue'
import DateTimeSlider from './DateTimeSlider.vue'

// Hourly dates over two weeks
const dates = Array.from(
  { length: 14 * 24 },
  (_, i) => new Date(Date.UTC(2025, 0, 1, i)),
)

const story = (width: number) => () =>
  h('div', { style: `padding-top: 120px; width: ${width}px` }, [
    h(DateTimeSlider, {
      dates,
      selectedDate: dates[100],
      doFollowNow: false,
    }),
  ])

export const Wide = story(1000)
export const Narrow = story(360)
