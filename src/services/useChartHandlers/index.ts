import {
  ModifierKey,
  MouseButton,
  PanHandler,
  PanningDirection,
  ZoomHandler,
  ZoomMode,
} from '@deltares/fews-web-oc-charts'
import { inject, provide } from 'vue'

const CHART_HANDLERS_KEY = Symbol('chartHandlers')

function getDefaultChartHandlers() {
  const sharedZoomHandler = new ZoomHandler({
    sharedZoomMode: ZoomMode.X,
  })
  const sharedVerticalZoomHandler = new ZoomHandler({
    sharedZoomMode: ZoomMode.Y,
  })
  const sharedPanHandler = new PanHandler({
    mouseButton: MouseButton.Left,
    modifierKey: ModifierKey.Shift,
    direction: PanningDirection.X,
  })

  return {
    sharedZoomHandler,
    sharedVerticalZoomHandler,
    sharedPanHandler,
  }
}

export function provideChartHandlers() {
  provide(CHART_HANDLERS_KEY, getDefaultChartHandlers())
}

export function useChartHandlers() {
  return inject(CHART_HANDLERS_KEY, getDefaultChartHandlers())
}
