import {
  ModifierKey,
  MouseButton,
  PanHandler,
  PanningDirection,
  ZoomHandler,
} from '@deltares/fews-web-oc-charts'
import type { ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'

export interface V4ChartHandlers {
  sharedZoomHandler: ZoomHandler
  sharedVerticalZoomHandler: ZoomHandler
  sharedPanHandler: PanHandler
}

const handlersByGroup = new WeakMap<ChartGroup, V4ChartHandlers>()

export function createV4ChartGroup(): {
  group: ChartGroup
  handlers: V4ChartHandlers
} {
  const group: ChartGroup = { id: Symbol('chartGroup') }
  const handlers = {
    sharedZoomHandler: new ZoomHandler({
      sharedZoomMode: 'x',
    }),
    sharedVerticalZoomHandler: new ZoomHandler({
      sharedZoomMode: 'y',
    }),
    sharedPanHandler: new PanHandler({
      mouseButton: MouseButton.Left,
      modifierKey: ModifierKey.Shift,
      direction: PanningDirection.X,
    }),
  }
  handlersByGroup.set(group, handlers)
  return { group, handlers }
}

export function getV4ChartHandlers(
  group?: ChartGroup,
): V4ChartHandlers | undefined {
  return group ? handlersByGroup.get(group) : undefined
}
