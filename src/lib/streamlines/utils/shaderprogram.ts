/**
 * A WebGL2 shader program.
 *
 * This also contains the locations of all its active attributes and uniforms.
 */
export class ShaderProgram {
  readonly gl: WebGL2RenderingContext
  readonly program: WebGLProgram
  private attributes: Map<string, number>
  private uniforms: Map<string, WebGLUniformLocation>

  constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
    this.gl = gl
    this.program = program
    this.attributes = new Map<string, number>()
    this.uniforms = new Map<string, WebGLUniformLocation>()
  }

  destruct(): void {
    this.gl.deleteProgram(this.program)
  }

  use(): void {
    this.gl.useProgram(this.program)
  }

  addAttributeLocation(name: string, location: number): void {
    this.attributes.set(name, location)
  }

  addUniformLocation(name: string, location: WebGLUniformLocation): void {
    this.uniforms.set(name, location)
  }

  getAttributeLocation(name: string): number {
    const location = this.attributes.get(name)
    if (location === undefined)
      throw new Error(`No attribute "${name}" exists.`)
    return location
  }

  getUniformLocation(name: string): WebGLUniformLocation {
    const location = this.uniforms.get(name)
    if (location === undefined) throw new Error(`No uniform "${name}" exists.`)
    return location
  }

  /**
   * Creates a shader program from a compiled vertex and fragment shader.
   *
   * @param gl WebGL2 rendering context.
   * @param vertexShader compiled vertex shader.
   * @param fragmentShader compiled fragment shader.
   * @returns shader program object.
   */
  static fromShaderSources(
    gl: WebGL2RenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
    transformFeedbackVaryings?: string[],
  ): ShaderProgram {
    const shaderProgram = gl.createProgram()
    if (shaderProgram === null) {
      throw new Error('Failed to create shader program.')
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    gl.attachShader(shaderProgram, vertexShader)

    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    )
    gl.attachShader(shaderProgram, fragmentShader)

    // Optionally bind transform feedback varyings.
    if (transformFeedbackVaryings) {
      gl.transformFeedbackVaryings(
        shaderProgram,
        transformFeedbackVaryings,
        gl.SEPARATE_ATTRIBS,
      )
    }

    gl.linkProgram(shaderProgram)
    const success = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)
    if (!success) {
      const log = gl.getProgramInfoLog(shaderProgram)
      throw new Error(log ?? 'Unknown shader linking error')
    }

    const program = new ShaderProgram(gl, shaderProgram)

    // Add all active attributes for this program to a map.
    const numAttributes = gl.getProgramParameter(
      shaderProgram,
      gl.ACTIVE_ATTRIBUTES,
    )
    for (let i = 0; i < numAttributes; i++) {
      const attribute = gl.getActiveAttrib(shaderProgram, i)
      if (attribute === null) continue

      program.addAttributeLocation(
        attribute.name,
        gl.getAttribLocation(shaderProgram, attribute.name),
      )
    }

    // Add all active uniforms for this program to a map.
    const numUniforms = gl.getProgramParameter(
      shaderProgram,
      gl.ACTIVE_UNIFORMS,
    )
    for (let i = 0; i < numUniforms; i++) {
      const uniform = gl.getActiveUniform(shaderProgram, i)
      if (uniform === null) continue

      const uniformLocation = gl.getUniformLocation(shaderProgram, uniform.name)
      if (uniformLocation === null) continue
      program.addUniformLocation(uniform.name, uniformLocation)
    }

    return program
  }
}

/**
 * Compiles a GLSL shader.
 *
 * @param gl WebGL2 rendering context.
 * @param type shader type, e.g. VERTEX_SHADER or FRAGMENT_SHADER.
 * @param source GLSL source to compile.
 * @returns compiled shader object.
 */
function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (shader === null) {
    throw new Error('Failed to create shader.')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (success) {
    return shader
  } else {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(log ?? 'Unknown shader compilation error')
  }
}

/**
 * Creates and fills a WebGL2 buffer.
 *
 * @param gl WebGL2 rendering context.
 * @param data values to fill the buffer with.
 * @returns filled WebGL2 buffer.
 */
export function createAndFillStaticBuffer(
  gl: WebGL2RenderingContext,
  data: ArrayBuffer,
): WebGLBuffer {
  const buffer = gl.createBuffer()
  if (buffer === null) {
    throw new Error('Failed to create buffer.')
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  return buffer
}

/**
 * Binds an N-dimensional (floating-point) buffer to an attribute.
 *
 * @param gl WebGL2 rendering context.
 * @param buffer buffer to bind to the attribute.
 * @param attribute index of the attribute to bind.
 * @param numComponents number of components of the attribute (e.g. 2 for a vec2)
 */
export function bindAttribute(
  gl: WebGL2RenderingContext,
  buffer: WebGLBuffer,
  attribute: number,
  numComponents: number,
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(attribute)
  const type = gl.FLOAT
  const doNormalise = false
  // Use the default stride, i.e. assume that data of each component follow each other directly,
  // without any padding.
  const stride = 0
  const offset = 0
  gl.vertexAttribPointer(
    attribute,
    numComponents,
    type,
    doNormalise,
    stride,
    offset,
  )
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
}

/**
 * Binds a texture to a texture unit and uniform.
 *
 * @param program Shader program.
 * @param uniform Name of the uniform to bind to.
 * @param unit Texture unit to use.
 * @param texture Texture to bind.
 */
export function bindTexture(
  program: ShaderProgram,
  uniform: string,
  unit: number,
  texture: WebGLTexture,
): void {
  const gl = program.gl
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(program.getUniformLocation(uniform), unit)
}
