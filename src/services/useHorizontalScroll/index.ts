export function useHorizontalScroll() {
  let lastPos = { x: 0, y: 0 }
  let moveHandler: (event: MouseEvent) => void
  let upHandler: (event: MouseEvent) => void

  function mouseWheelHandler(event: WheelEvent): void {
    if (!event.currentTarget) return
    const element = event.currentTarget as HTMLElement

    element.scrollLeft += event.deltaY
  }

  function mouseDownHandler(event: MouseEvent): void {
    if (!event.currentTarget) return
    const element = event.currentTarget as HTMLElement

    lastPos = {
      x: event.clientX,
      y: event.clientY,
    }

    moveHandler = (event) => mouseMoveHandler(event, element)
    upHandler = () => mouseUpHandler(element)

    document.addEventListener('pointermove', moveHandler)
    document.addEventListener('pointerup', upHandler)
  }

  function mouseMoveHandler(event: MouseEvent, element: HTMLElement): void {
    const dx = event.clientX - lastPos.x

    lastPos = {
      x: event.clientX,
      y: event.clientY,
    }

    element.scrollLeft -= dx

    element.style.cursor = 'grabbing'
  }

  function mouseUpHandler(element: HTMLElement): void {
    element.style.cursor = 'inherit'

    document.removeEventListener('pointermove', moveHandler)
    document.removeEventListener('pointerup', upHandler)
  }

  return {
    mouseWheelHandler,
    mouseDownHandler,
  }
}
