export function useHorizontalScroll() {
  let pos = { top: 0, left: 0, x: 0, y: 0 }

  function mouseWheelHandler(event: WheelEvent): void {
    if (!event.currentTarget) return
    const element = event.currentTarget as HTMLElement

    element.scrollLeft += event.deltaY
    pos.left = element.scrollLeft
  }

  function mouseMoveHandler(event: MouseEvent): void {
    if (!event.currentTarget) return
    const element = event.currentTarget as HTMLElement

    const dx = event.clientX - pos.x
    const dy = event.clientY - pos.y

    pos.left = element.scrollLeft

    element.scrollTop = pos.top - dy
    element.scrollLeft = pos.left - dx

    element.style.cursor = 'grabbing'
  }

  function mouseDownHandler(event: MouseEvent): void {
    if (!event.currentTarget) return
    const element = event.currentTarget as HTMLElement
    const { scrollLeft, scrollTop } = element

    pos = {
      // The current scroll
      left: scrollLeft,
      top: scrollTop,
      // Get the current mouse position
      x: event.clientX,
      y: event.clientY,
    }

    element.addEventListener('pointermove', mouseMoveHandler)
    element.addEventListener('pointerup', mouseUpHandler)
  }

  function mouseUpHandler(event: MouseEvent): void {
    if (!event.currentTarget) return
    const element = event.currentTarget as HTMLElement
    const { scrollLeft, scrollTop } = element

    pos.left = scrollLeft
    pos.top = scrollTop

    element.style.cursor = 'inherit'

    element.removeEventListener('pointermove', mouseMoveHandler)
    element.removeEventListener('pointerup', mouseUpHandler)
  }

  return {
    mouseWheelHandler,
    mouseDownHandler,
  }
}
