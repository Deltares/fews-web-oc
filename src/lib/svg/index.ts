import * as d3 from 'd3'

export function addD3ZoomToSvg(element: SVGElement) {
  const svg = d3.select(element)

  const allChildren = svg.selectChildren()
  const content = svg.append('g')
  const contentNode = content.node()
  if (!contentNode) return

  allChildren.each((_, i, nodes) => {
    const child = nodes[i] as Element
    contentNode.appendChild(child)
  })

  const { width, height } = getSvgContainerSizes(element) ?? {
    width: 0,
    height: 0,
  }

  type D3ZoomEvent = d3.D3ZoomEvent<SVGElement, unknown>

  const zoomStart = (event: D3ZoomEvent) => {
    if (event.sourceEvent?.type === 'mousedown') {
      svg.style('cursor', 'grabbing')
    }
  }

  const zooming = ({ transform }: D3ZoomEvent) => {
    content.attr('transform', transform.toString())
  }

  const zoomEnd = (event: D3ZoomEvent) => {
    if (event.sourceEvent?.type === 'mouseup') {
      svg.style('cursor', 'inherit')
    }
  }

  const zoom = d3
    .zoom<SVGElement, unknown>()
    .scaleExtent([1, 10])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on('start', zoomStart)
    .on('zoom', zooming)
    .on('end', zoomEnd)

  const resetZoom = () => {
    svg.transition().duration(100).call(zoom.transform, d3.zoomIdentity)
  }

  svg.call(zoom).on('dblclick.zoom', resetZoom)
}

export function isSVGElement(node: Node): node is SVGElement {
  return node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'svg'
}

export function getAspectRatio(svg: SVGElement): number {
  const containerSizes = getSvgContainerSizes(svg)
  if (!containerSizes) return 1

  const { width, height } = containerSizes
  return width / height
}

export function getSvgContainerSizes(svg: SVGElement) {
  const viewBox = svg.getAttribute('viewBox')
  if (!viewBox) return

  const [minX, minY, width, height] = viewBox.split(' ', 4).map((x) => +x)
  return {
    minX,
    minY,
    width,
    height,
  }
}

export function getDimensions(
  element: HTMLElement,
  aspectRatio: number,
  fitWidthValue: boolean,
) {
  let height = element.clientHeight
  let width = element.offsetWidth
  let margins = { top: 0, left: 0 }

  const dx = width - height * aspectRatio

  if (dx < 0 && !fitWidthValue) {
    // add space for scrollbar
    width = height * aspectRatio
  } else if (dx < 0) {
    margins = { top: (height - width / aspectRatio) / 2, left: 0 }
  } else {
    width = height * aspectRatio
    margins = { top: 0, left: dx / 2 }
  }

  return {
    width,
    height,
    margins,
  }
}
