import { createTexture } from './textures'

/**
 * An RGB color.
 */
export class Color {
  r: number
  g: number
  b: number

  constructor(r: number, g: number, b: number) {
    this.r = r
    this.g = g
    this.b = b
  }

  /**
   * Parses a color from a hexadecimal color string.
   * @param hex hexadecimal color string.
   * @returns color parsed from the hexadecimal color string.
   */
  static fromHex(hex: string): Color {
    const r = parseInt(hex.substring(1, 3), 16)
    const g = parseInt(hex.substring(3, 5), 16)
    const b = parseInt(hex.substring(5, 7), 16)
    return new Color(r, g, b)
  }
}

/**
 * A colormap.
 *
 * Its values may be non-uniformly spaced.
 */
export class Colormap {
  private values: number[]
  private colors: Color[]

  constructor(values: number[], colors: Color[]) {
    if (values.length !== colors.length) {
      throw new Error(
        'Number of colormap values should be the same as the number of colors.',
      )
    }
    this.values = values
    this.colors = colors
  }

  /** Number of points in the colormap. */
  get num(): number {
    return this.values.length
  }

  /** Start value of the colormap. */
  get start(): number {
    return this.values[0]
  }

  /** End value of the colormap. */
  get end(): number {
    return this.values[this.values.length - 1]
  }

  /** Range of the colormap (i.e. difference between start and end). */
  get range(): number {
    return this.end - this.start
  }

  /**
   * Creates a 1D texture from this colormap.
   *
   * The colormap as obtained from the GetLegendGraphic FEWS WMS endpoint may be non-uniformly
   * spaced. This function linearly interpolates this non-uniformly spaced colormap to a uniformly
   * spaced texture, from the colormap's start to its end.
   *
   * @param numPoints number of points in the texture.
   * @returns Colour map as a WebGL texture (note: not RGBA).
   */
  toTexture(gl: WebGL2RenderingContext, numPoints: number): WebGLTexture {
    const colormapTexture = createTexture(
      gl,
      gl.LINEAR,
      this.to1DRGBTextureData(numPoints),
      numPoints,
      1,
    )
    return colormapTexture
  }

  private to1DRGBTextureData(numPoints: number): Uint8Array {
    // Uniform step size between start and end for the texture data.
    const step = this.range / (numPoints - 1)

    const data = new Uint8Array(3 * numPoints)
    for (let i = 0; i < numPoints; i++) {
      let color: Color
      if (i == 0) {
        color = this.colors[0]
      } else if (i == numPoints - 1) {
        color = this.colors[this.num - 1]
      } else {
        const value = this.start + i * step
        const indexNext = this.values.findIndex((entry) => entry > value)
        const indexPrev = indexNext - 1

        const distPrev = Math.abs(value - this.values[indexPrev])
        const distNext = Math.abs(value - this.values[indexNext])
        // Linearly interpolate the colours for this point.
        const weightPrev = distNext / (distPrev + distNext)
        const weightNext = distPrev / (distPrev + distNext)
        color = new Color(
          this.colors[indexPrev].r * weightPrev +
            this.colors[indexNext].r * weightNext,
          this.colors[indexPrev].g * weightPrev +
            this.colors[indexNext].g * weightNext,
          this.colors[indexPrev].b * weightPrev +
            this.colors[indexNext].b * weightNext,
        )
      }

      // Set the RGB values for this point, smallest stride is RGB.
      const index = 3 * i
      data[index] = color.r
      data[index + 1] = color.g
      data[index + 2] = color.b
    }

    return data
  }
}
