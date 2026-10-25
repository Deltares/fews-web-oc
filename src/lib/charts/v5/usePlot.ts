import {
  createPlot,
  type Plot,
  type PlotConfig,
} from '@deltares/fews-web-oc-charts'
import {
  markRaw,
  onBeforeUnmount,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'

export function usePlot(
  element: Ref<HTMLElement | null>,
  config: ComputedRef<PlotConfig>,
) {
  const plot = shallowRef<Plot>()

  watch(
    [element, config],
    ([container, nextConfig]) => {
      if (!container) return

      if (!plot.value || plot.value.element.parentElement !== container) {
        plot.value?.destroy()
        plot.value = markRaw(createPlot(container, nextConfig))
      } else {
        plot.value.setConfig(nextConfig)
      }
    },
    { flush: 'post', immediate: true },
  )

  onBeforeUnmount(() => {
    plot.value?.destroy()
    plot.value = undefined
  })

  return plot
}
