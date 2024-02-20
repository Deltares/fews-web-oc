/**
 * Creates a new texture.
 *
 * This requires that the data are unsigned 8-bit integers for each channel. Based on the size of
 * the data, we determine whether they are RGB or RGBA; other formats are not supported and will
 * raise an error.
 *
 * Values are clamped to the edges at both S- and T-boundaries, and interpolation for minification
 * and magnification is done linearly.
 *
 * @param uniform uniform to bind the texture to.
 * @param data data to assign to the texture, must be unsigned 8-bit integers.
 * @param width width of the texture.
 * @param height height of the texture.
 * @returns initialised and bound texture.
 */
export function createTexture(
  gl: WebGL2RenderingContext,
  filter: number,
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): WebGLTexture {
  const texture = gl.createTexture()
  if (texture === null) {
    throw new Error('Failed to create texture.')
  }

  const numPixels = width * height
  let format = 0
  if (3 * numPixels === data.length) {
    format = gl.RGB
  } else if (4 * numPixels === data.length) {
    format = gl.RGBA
  } else {
    throw new Error('Only RGB or RGBA textures are supported.')
  }

  // Set texture properties and initialise data.
  gl.bindTexture(gl.TEXTURE_2D, texture)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    format,
    width,
    height,
    0,
    format,
    gl.UNSIGNED_BYTE,
    data,
  )

  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}
