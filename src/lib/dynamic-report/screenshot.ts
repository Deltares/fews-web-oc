import type { Map as MapLibreMap } from 'maplibre-gl'
import { convertSvgElementToImage, createExportableSvgElement } from '@/lib/svg'

export interface ScreenshotOptions {
  maxDimension?: number
  renderTimeoutMs?: number
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

  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>
    const cleanup = () => {
      clearTimeout(timer)
      map.off('render', onRender)
    }
    const onRender = () => {
      cleanup()
      try {
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

  if (chartImage) {
    context.drawImage(
      chartImage,
      0,
      Math.round(mapHeight * scale),
      canvas.width,
      canvas.height - Math.round(mapHeight * scale),
    )
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not encode screenshot as PNG'))
    }, 'image/png')
  })
}
