// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureNodeScreenshot } from '@/lib/dynamic-report/screenshot'
import { convertSvgElementToImage, createExportableSvgElement } from '@/lib/svg'
import type { Map as MapLibreMap } from 'maplibre-gl'

vi.mock('@/lib/svg', () => ({
  createExportableSvgElement: vi.fn((svg: SVGSVGElement) => svg),
  convertSvgElementToImage: vi.fn(async () => new Image()),
}))

function setupMap(width = 800, height = 600) {
  const mapCanvas = document.createElement('canvas')
  mapCanvas.width = width
  mapCanvas.height = height
  let handler: (() => void) | undefined
  const map = {
    getCanvas: () => mapCanvas,
    loaded: vi.fn(() => true),
    on: vi.fn((_event: string, callback: () => void) => {
      handler = callback
    }),
    off: vi.fn(() => {
      handler = undefined
    }),
    triggerRepaint: vi.fn(() => handler?.()),
  }
  const drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback) => callback(new Blob(['png'], { type: 'image/png' })),
  )
  return {
    map: map as unknown as MapLibreMap,
    mocks: map,
    mapCanvas,
    drawImage,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('captureNodeScreenshot', () => {
  it('copies the map during its render event and returns a PNG', async () => {
    const { map, mocks, mapCanvas, drawImage } = setupMap(3840, 2160)
    const blob = await captureNodeScreenshot(map)

    expect(blob.type).toBe('image/png')
    expect(drawImage).toHaveBeenCalledWith(mapCanvas, 0, 0, 1920, 1080)
    expect(mocks.triggerRepaint).toHaveBeenCalledOnce()
    expect(mocks.off).toHaveBeenCalledWith('render', expect.any(Function))
  })

  it.each([640, 1280, 1920])(
    'limits the output to %i pixels without changing its aspect ratio',
    async (maxDimension) => {
      const { map, mapCanvas, drawImage } = setupMap(3840, 1920)
      await captureNodeScreenshot(map, { maxDimension })
      expect(drawImage).toHaveBeenCalledWith(
        mapCanvas,
        0,
        0,
        maxDimension,
        maxDimension / 2,
      )
      const output = vi.mocked(HTMLCanvasElement.prototype.getContext).mock
        .instances[0]
      expect(output.width).toBe(maxDimension)
      expect(output.height).toBe(maxDimension / 2)
    },
  )

  it('does not enlarge a map smaller than the selected limit', async () => {
    const { map, mapCanvas, drawImage } = setupMap(320, 240)
    await captureNodeScreenshot(map, { maxDimension: 640 })
    expect(drawImage).toHaveBeenCalledWith(mapCanvas, 0, 0, 320, 240)
  })

  it('rejects unloaded and empty maps', async () => {
    const { map, mocks } = setupMap()
    mocks.loaded.mockReturnValue(false)
    await expect(captureNodeScreenshot(map)).rejects.toThrow(
      'The map is not ready for a screenshot',
    )
    mocks.loaded.mockReturnValue(true)
    map.getCanvas().width = 0
    await expect(captureNodeScreenshot(map)).rejects.toThrow(
      'The map has no visible screenshot area',
    )
  })

  it('does not capture a map that starts loading before it renders', async () => {
    const { map, mocks, drawImage } = setupMap()
    mocks.triggerRepaint.mockImplementation(() => {
      mocks.loaded.mockReturnValue(false)
      const callback = mocks.on.mock.calls[0]?.[1]
      callback?.()
    })
    await expect(captureNodeScreenshot(map)).rejects.toThrow(
      'The map is not ready for a screenshot',
    )
    expect(drawImage).not.toHaveBeenCalled()
  })

  it('places an exported chart below the map within the size limit', async () => {
    const { map, mapCanvas, drawImage } = setupMap(800, 600)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const chartImage = new Image()
    vi.mocked(convertSvgElementToImage).mockResolvedValueOnce(chartImage)

    await captureNodeScreenshot(map, {
      maxDimension: 800,
      chart: { svg, css: '.chart { color: red }', width: 800, height: 400 },
    })

    expect(createExportableSvgElement).toHaveBeenCalledWith(
      svg,
      '.chart { color: red }',
    )
    expect(convertSvgElementToImage).toHaveBeenCalledWith(svg, [640, 320])
    expect(drawImage).toHaveBeenNthCalledWith(1, mapCanvas, 0, 0, 640, 480)
    expect(drawImage).toHaveBeenNthCalledWith(2, chartImage, 0, 480, 640, 320)
  })

  it.each([640, 1280, 1920])(
    'limits the combined map and chart to %i pixels',
    async (maxDimension) => {
      const { map, mapCanvas, drawImage } = setupMap(3840, 1920)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      await captureNodeScreenshot(map, {
        maxDimension,
        chart: { svg, css: '', width: 800, height: 400 },
      })
      const output = vi.mocked(HTMLCanvasElement.prototype.getContext).mock
        .instances[0]
      expect(output.width).toBe(maxDimension)
      expect(output.height).toBe(maxDimension)
      expect(drawImage).toHaveBeenNthCalledWith(
        1,
        mapCanvas,
        0,
        0,
        maxDimension,
        maxDimension / 2,
      )
      expect(drawImage).toHaveBeenNthCalledWith(
        2,
        expect.any(Image),
        0,
        maxDimension / 2,
        maxDimension,
        maxDimension / 2,
      )
    },
  )

  it('removes its listener when rendering times out', async () => {
    vi.useFakeTimers()
    const { map, mocks } = setupMap()
    mocks.triggerRepaint.mockImplementation(() => {})
    const result = captureNodeScreenshot(map, { renderTimeoutMs: 100 })
    const rejected = expect(result).rejects.toThrow(
      'Timed out waiting for the map to render',
    )
    await vi.advanceTimersByTimeAsync(100)
    await rejected
    expect(mocks.off).toHaveBeenCalledWith('render', expect.any(Function))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('propagates failures when copying the canvas', async () => {
    const { map, mocks, drawImage } = setupMap()
    drawImage.mockImplementation(() => {
      throw new DOMException('Canvas is tainted', 'SecurityError')
    })
    await expect(captureNodeScreenshot(map)).rejects.toThrow(
      'Canvas is tainted',
    )
    expect(mocks.off).toHaveBeenCalledOnce()
  })

  it('cleans up when map listener registration fails', async () => {
    vi.useFakeTimers()
    const { map, mocks } = setupMap()
    mocks.on.mockImplementation(() => {
      throw new Error('Map was removed')
    })
    await expect(captureNodeScreenshot(map)).rejects.toThrow('Map was removed')
    expect(vi.getTimerCount()).toBe(0)
    expect(mocks.off).toHaveBeenCalledOnce()
  })

  it('reports an encoding failure', async () => {
    const { map } = setupMap()
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(
      (callback) => callback(null),
    )
    await expect(captureNodeScreenshot(map)).rejects.toThrow(
      'Could not encode screenshot as PNG',
    )
  })

  it('rejects invalid screenshot options', async () => {
    const { map } = setupMap()
    await expect(
      captureNodeScreenshot(map, { maxDimension: 0 }),
    ).rejects.toThrow('Screenshot maximum dimension must be positive')
    await expect(
      captureNodeScreenshot(map, { renderTimeoutMs: 0 }),
    ).rejects.toThrow('Screenshot render timeout must be positive')
  })
})
