import * as GeoTIFF from 'geotiff'

import { Color, Colormap } from "./colormap"
import { createTexture } from './textures'
import { color } from 'd3'

export class VelocityImage {
  constructor(
    private data: Uint8Array,
    readonly width: number,
    readonly height: number,
    readonly uOffset: number,
    readonly vOffset: number,
    readonly uScale: number,
    readonly vScale: number
  ) {}

  maxVelocity(): [number, number] {
    const computeU = (r: number) => r * this.uScale + this.uOffset
    const computeV = (g: number) => g * this.vScale + this.vOffset

    return [
      Math.max(computeU(0), computeU(1)),
      Math.max(computeV(0), computeV(1))
    ]
  }

  toTexture(gl: WebGL2RenderingContext, interpolate: boolean): WebGLTexture {
    return createTexture(gl, interpolate ? gl.LINEAR : gl.NEAREST, this.data, this.width, this.height)
  }
}

/**
 * Fetches a colormap for a WMS layer from the FEWS web services.
 *
 * @param baseUrl base URL of the FEWS WMS service.
 * @param layer layer to obtain the legend for.
 * @returns Colormap fetched from the FEWS WMS service.
 */
export async function fetchWMSColormap(baseUrl: string, layer: string, colorScaleRange?: string): Promise<Colormap> {
  // TODO: use fews-wms-requests and its types.
  let url = `${baseUrl}?request=GetLegendGraphic&format=application/json&version=1.3&layers=${layer}`
  if (colorScaleRange !== undefined) {
    url = `${url}&colorscalerange=${colorScaleRange}`
  }
  const json = await (await fetch(url)).json() as { legend: { lowerValue: number, color: string }[] }

  return new Colormap(
    json.legend.map(entry => entry.lowerValue),
    json.legend.map(entry => Color.fromHex(entry.color))
  )
}

export async function fetchWMSAvailableTimesAndElevations(baseUrl: string, layer: string): Promise<{times: string[], elevationBounds: [number, number] | null}> {
  const getCapabilitiesUrl = `${baseUrl}?request=GetCapabilities&format=application/json&version=1.3&layers=${layer}`
  const response = await fetch(getCapabilitiesUrl)
  const capabilities = await response.json()

  console.assert(capabilities.layers !== undefined && capabilities.layers.length === 1)
  const elevationBounds = (capabilities.layers[0].elevation !== undefined ? [+capabilities.layers[0].elevation.lowerValue, +capabilities.layers[0].elevation.upperValue] : null) as [number, number] | null
  return { times: capabilities.layers[0].times, elevationBounds: elevationBounds}
}

export async function fetchWMSVelocityField(
  baseUrl: string,
  layer: string,
  style: string,
  time: string,
  boundingBox: [number, number, number, number],
  width: number,
  height: number,
  elevation?: number,
  colorScaleRange?: string
): Promise<VelocityImage> {

  const url = new URL(baseUrl)
  url.searchParams.append('service', 'WMS')
  url.searchParams.append('request', 'GetMap')
  url.searchParams.append('version', '1.3')
  url.searchParams.append('layers', layer)
  url.searchParams.append('styles', style)
  url.searchParams.append('transparent', 'true')
  url.searchParams.append('crs', 'EPSG:3857')
  url.searchParams.append('showContours', 'false')
  url.searchParams.append('time', time)
  url.searchParams.append('uppercase', 'false')
  url.searchParams.append('width', `${width}`)
  url.searchParams.append('height', `${height}`)
  url.searchParams.append('bbox', `${boundingBox.join(',')}`)
  url.searchParams.append('format', 'image/tiff')
  url.searchParams.append('convertUVToRG', 'true')

  if (elevation !== undefined) {
    url.searchParams.append('elevation', `${elevation}`)
  }

  if (colorScaleRange !== undefined) {
    url.searchParams.append('colorScaleRange', `${colorScaleRange}`)
  }

  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()

  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()
  const fileDirectory = image.getFileDirectory()

  // Assume we have 8-bit data per channel.
  console.assert(fileDirectory.BitsPerSample.every((numBits: number) => numBits === 8))

  // Get image data, it should always have unsigned 8-bit integers for each channel.
  // For some mysterious reason, the GeoTIFF types say that this function produces a Int8Array,
  // while in reality it produces a Uint8Array.
  const dataUntyped = await image.readRasters({ interleave: true }) as unknown
  const data = dataUntyped as Uint8Array

  // Get offsets and scales for the image. We multiply the scales by 255, since 255 of an unsigned
  // 8-bit integer corresponds to a texture value of 1.0 in WebGL.
  const receivedWidth = fileDirectory.ImageWidth
  const receivedHeight = fileDirectory.ImageLength
  const uOffset = fileDirectory.ModelTiepoint[0]
  const vOffset = fileDirectory.ModelTiepoint[1]
  const uScale = fileDirectory.ModelPixelScale[0] * 255
  const vScale = fileDirectory.ModelPixelScale[1] * 255

  return new VelocityImage(
    data, receivedWidth, receivedHeight,
    uOffset, vOffset, uScale, vScale
  )
}
