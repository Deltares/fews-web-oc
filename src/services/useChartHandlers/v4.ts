import {
  ModifierKey,
  MouseButton,
  PanHandler,
  PanningDirection,
  ZoomHandler,
  type CartesianAxes,
} from '@deltares/fews-web-oc-charts'
import type { ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'

export interface V4ChartHandlers {
  sharedZoomHandler: ZoomHandler
  sharedVerticalZoomHandler: ZoomHandler
  sharedPanHandler: PanHandler
}

const handlersByGroup = new WeakMap<ChartGroup, V4ChartHandlers>()
const panAxesByGroup = new WeakMap<ChartGroup, Set<CartesianAxes>>()
const panModifierByGroup = new WeakMap<ChartGroup, ModifierKey>()

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
  panAxesByGroup.set(group, new Set())
  panModifierByGroup.set(group, ModifierKey.Shift)
  return { group, handlers }
}

export function getV4ChartHandlers(
  group?: ChartGroup,
): V4ChartHandlers | undefined {
  return group ? handlersByGroup.get(group) : undefined
}

export function attachV4PanHandler(
  group: ChartGroup,
  axis: CartesianAxes,
  modifierKey: ModifierKey,
): void {
  const handlers = getV4ChartHandlers(group)
  const axes = panAxesByGroup.get(group)
  if (!handlers || !axes) return

  updateV4PanModifierKey(group, modifierKey)
  if (axes.has(axis)) return

  axes.add(axis)
  axis.accept(handlers.sharedPanHandler)
}

export function updateV4PanModifierKey(
  group: ChartGroup,
  modifierKey: ModifierKey,
): void {
  const handlers = getV4ChartHandlers(group)
  const axes = panAxesByGroup.get(group)
  if (!handlers || !axes || panModifierByGroup.get(group) === modifierKey) {
    return
  }

  const previousHandler = handlers.sharedPanHandler
  previousHandler.destroy()
  for (const axis of axes) {
    axis.visitors = axis.visitors.filter(
      (visitor) => visitor !== previousHandler,
    )
  }

  const nextHandler = new PanHandler({
    mouseButton: MouseButton.Left,
    modifierKey,
    direction: PanningDirection.X,
  })
  handlers.sharedPanHandler = nextHandler
  panModifierByGroup.set(group, modifierKey)
  for (const axis of axes) {
    axis.accept(nextHandler)
  }
}
