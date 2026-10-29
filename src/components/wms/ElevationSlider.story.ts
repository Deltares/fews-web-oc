import { defineComponent, h, ref, type PropType } from 'vue'
import ElevationSlider from './ElevationSlider.vue'

const ElevationSliderStory = defineComponent({
  props: {
    initialValue: { type: Number, required: true },
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    ticks: { type: Array as PropType<number[]>, default: undefined },
  },
  setup(props) {
    const value = ref(props.initialValue)

    return () =>
      h('div', [
        h('div', { style: 'position: relative; height: 320px; width: 200px' }, [
          h(ElevationSlider, {
            modelValue: value.value,
            minValue: props.minValue,
            maxValue: props.maxValue,
            ticks: props.ticks,
            unit: 'm',
            'onUpdate:modelValue': (newValue: number) => {
              value.value = newValue
            },
          }),
        ]),
        h('output', { 'data-testid': 'elevation-value' }, String(value.value)),
        h('input', { 'aria-label': 'Other field' }),
      ])
  },
})

export const MinMax = () =>
  h(ElevationSliderStory, { initialValue: -10, minValue: -50, maxValue: 0 })

export const DescendingTicks = () =>
  h(ElevationSliderStory, {
    initialValue: -10,
    minValue: -50,
    maxValue: 0,
    ticks: [0, -5, -10, -50],
  })
