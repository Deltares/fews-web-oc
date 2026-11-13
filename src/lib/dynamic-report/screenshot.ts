import type { Map as MapLibreMap } from 'maplibre-gl'
import { convertSvgElementToImage, createExportableSvgElement } from '@/lib/svg'

export interface ScreenshotOptions {
  maxDimension?: number
  renderTimeoutMs?: number
  legend?: HTMLElement
  chart?: {
    svg: SVGSVGElement
    css: string
    width: number
    height: number
  }
}

export const DEFAULT_MAX_SCREENSHOT_DIMENSION = 1920

type CaptureMap = Pick<
  MapLibreMap,
  'getCanvas' | 'loaded' | 'on' | 'off' | 'triggerRepaint'
>

export async function captureNodeScreenshot(
  map: CaptureMap,
  options: ScreenshotOptions = {},
): Promise<Blob> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_SCREENSHOT_DIMENSION
  const timeoutMs = options.renderTimeoutMs ?? 10000
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    throw new Error('Screenshot maximum dimension must be positive')
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Screenshot render timeout must be positive')
  }
  if (!map.loaded()) {
    throw new Error('The map is not ready for a screenshot')
  }

  const mapCanvas = map.getCanvas()
  const mapWidth = mapCanvas.width
  const mapHeight = mapCanvas.height
  if (mapWidth <= 0 || mapHeight <= 0) {
    throw new Error('The map has no visible screenshot area')
  }

  const chart = options.chart
  if (
    chart &&
    (!Number.isFinite(chart.width) ||
      !Number.isFinite(chart.height) ||
      chart.width <= 0 ||
      chart.height <= 0)
  ) {
    throw new Error('The chart has no visible screenshot area')
  }
  const chartHeight = chart ? (chart.height * mapWidth) / chart.width : 0
  const scale = Math.min(
    1,
    maxDimension / Math.max(mapWidth, mapHeight + chartHeight),
  )
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(mapWidth * scale))
  canvas.height = Math.max(1, Math.round((mapHeight + chartHeight) * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create screenshot canvas')

  const chartImage = chart
    ? await convertSvgElementToImage(
        createExportableSvgElement(chart.svg, chart.css),
        [canvas.width, Math.max(1, Math.round(chartHeight * scale))],
      )
    : undefined
  const legend = options.legend
  const legendBounds = legend?.getBoundingClientRect()
  const mapBounds = mapCanvas.getBoundingClientRect()
  const legendImage =
    legend && legendBounds
      ? await createLegendImage(legend, legendBounds.width, legendBounds.height)
      : undefined
  if (legendImage && (mapBounds.width <= 0 || mapBounds.height <= 0)) {
    throw new Error('The map legend has no visible screenshot area')
  }

  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>
    const cleanup = () => {
      clearTimeout(timer)
      map.off('render', onRender)
    }
    const onRender = () => {
      cleanup()
      try {
        if (!map.loaded()) {
          throw new Error('The map is not ready for a screenshot')
        }
        context.drawImage(
          mapCanvas,
          0,
          0,
          canvas.width,
          Math.round(mapHeight * scale),
        )
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for the map to render'))
    }, timeoutMs)
    try {
      map.on('render', onRender)
      map.triggerRepaint()
    } catch (error) {
      cleanup()
      reject(error)
    }
  })

  if (legendImage && legendBounds) {
    const scaleX = canvas.width / mapBounds.width
    const scaleY = Math.round(mapHeight * scale) / mapBounds.height
    context.drawImage(
      legendImage,
      (legendBounds.left - mapBounds.left) * scaleX,
      (legendBounds.top - mapBounds.top) * scaleY,
      legendBounds.width * scaleX,
      legendBounds.height * scaleY,
    )
  }

  if (chartImage) {
    context.drawImage(
      chartImage,
      0,
      Math.round(mapHeight * scale),
      canvas.width,
      canvas.height - Math.round(mapHeight * scale),
    )
  }

  async function createLegendImage(
    legend: HTMLElement,
    width: number,
    height: number,
  ): Promise<HTMLImageElement> {
    if (width <= 0 || height <= 0) {
      throw new Error('The map legend has no visible screenshot area')
    }
    const namespace = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(namespace, 'svg')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    const sourceSvg = legend.querySelector('svg')
    if (sourceSvg) {
      const clone = sourceSvg.cloneNode(true) as SVGSVGElement
      const sources = [sourceSvg, ...sourceSvg.querySelectorAll('*')]
      const targets = [clone, ...clone.querySelectorAll('*')]
      sources.forEach((source, index) => {
        const style = getComputedStyle(source)
        const target = targets[index]
        if (!(target instanceof SVGElement)) return
        for (const property of [
          'fill',
          'stroke',
          'stroke-width',
          'font-family',
          'font-size',
          'font-weight',
          'text-anchor',
          'dominant-baseline',
          'opacity',
          'stop-color',
          'stop-opacity',
          'text-shadow',
        ]) {
          target.style.setProperty(property, style.getPropertyValue(property))
        }
      })
      clone.setAttribute('width', String(width))
      clone.setAttribute('height', String(height))
      svg.appendChild(clone)
    } else {
      const bounds = legend.getBoundingClientRect()
      for (const element of legend.querySelectorAll<HTMLElement>(
        '.box, .legend-label, p',
      )) {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const x = rect.left - bounds.left
        const y = rect.top - bounds.top
        if (element.classList.contains('box')) {
          const box = document.createElementNS(namespace, 'rect')
          box.setAttribute('x', String(x))
          box.setAttribute('y', String(y))
          box.setAttribute('width', String(rect.width))
          box.setAttribute('height', String(rect.height))
          box.setAttribute('fill', style.backgroundColor)
          box.setAttribute('stroke', style.borderTopColor)
          svg.appendChild(box)
        } else {
          const text = document.createElementNS(namespace, 'text')
          text.setAttribute('x', String(x))
          text.setAttribute('y', String(y + rect.height / 2))
          text.setAttribute('dominant-baseline', 'central')
          text.setAttribute('fill', style.color)
          text.setAttribute('font-family', style.fontFamily)
          text.setAttribute('font-size', style.fontSize)
          text.setAttribute('font-weight', style.fontWeight)
          text.style.textShadow = style.textShadow
          text.textContent = element.textContent
          svg.appendChild(text)
        }
      }
    }
    return convertSvgElementToImage(svg, [width, height])
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not encode screenshot as PNG'))
    }, 'image/png')
  })
}
