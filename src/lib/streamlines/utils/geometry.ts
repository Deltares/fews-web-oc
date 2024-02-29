import {
  ShaderProgram,
  bindAttribute,
  createAndFillStaticBuffer,
} from './shaderprogram'

export function createRectangleVertexArray(
  program: ShaderProgram,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  positionAttribute: string,
  vertexCoordAttribute: string,
): [WebGLBuffer, WebGLBuffer, WebGLVertexArrayObject] {
  const gl = program.gl
  const vertexArray = gl.createVertexArray()
  if (vertexArray === null) {
    throw new Error('Failed to create vertex array.')
  }
  gl.bindVertexArray(vertexArray)

  const positions = [xMax, yMax, xMin, yMax, xMax, yMin, xMin, yMin]
  const texCoords = [1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]
  const positionBuffer = createAndFillStaticBuffer(
    gl,
    new Float32Array(positions),
  )
  const texCoordBuffer = createAndFillStaticBuffer(
    gl,
    new Float32Array(texCoords),
  )

  bindAttribute(
    gl,
    positionBuffer,
    program.getAttributeLocation(positionAttribute),
    2,
  )
  bindAttribute(
    gl,
    texCoordBuffer,
    program.getAttributeLocation(vertexCoordAttribute),
    2,
  )

  gl.bindVertexArray(null)

  return [positionBuffer, texCoordBuffer, vertexArray]
}
