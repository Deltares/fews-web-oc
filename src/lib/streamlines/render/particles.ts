import { createRectangleVertexArray } from '../utils/geometry'
import { ShaderProgram, bindTexture } from '../utils/shaderprogram'

export class ParticleRenderer {
  public particleSize: number

  private program: ShaderProgram
  private width: number
  private height: number
  private numParticles: number
  private particleTexture: WebGLTexture
  private particlePositionTexture: WebGLTexture | null
  private positionBuffer: WebGLBuffer | null
  private texCoordBuffer: WebGLBuffer | null
  private vertexArray: WebGLVertexArrayObject | null
  private widthParticlePositionTexture: number
  private heightParticlePositionTexture: number

  constructor(
    program: ShaderProgram,
    width: number,
    height: number,
    numParticles: number,
    particleSize: number,
    particleTexture: WebGLTexture,
    widthParticlePositionTexture: number,
    heightParticlePositionTexture: number,
  ) {
    this.program = program

    this.width = width
    this.height = height
    this.numParticles = numParticles
    this.particleSize = particleSize
    this.particleTexture = particleTexture
    this.particlePositionTexture = null
    this.widthParticlePositionTexture = widthParticlePositionTexture
    this.heightParticlePositionTexture = heightParticlePositionTexture

    this.positionBuffer = null
    this.texCoordBuffer = null
    this.vertexArray = null
  }

  initialise(): void {
    const [positionBuffer, texCoordBuffer, vertexArray] =
      createRectangleVertexArray(
        this.program,
        -0.5,
        0.5,
        -0.5,
        0.5,
        'a_position',
        'a_tex_coord',
      )
    this.positionBuffer = positionBuffer
    this.texCoordBuffer = texCoordBuffer
    this.vertexArray = vertexArray
    this.particlePositionTexture = this.createParticlePositionTexture()
  }

  destruct(): void {
    const gl = this.program.gl
    gl.deleteBuffer(this.positionBuffer)
    gl.deleteBuffer(this.texCoordBuffer)
    gl.deleteVertexArray(this.vertexArray)
    gl.deleteTexture(this.particlePositionTexture)
    gl.deleteTexture(this.particleTexture)
    this.program.destruct()
  }

  setDimensions(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  setNumParticles(
    numParticles: number,
    widthParticlePositionTexture: number,
    heightParticlePositionTexture: number,
  ): void {
    this.numParticles = numParticles
    this.widthParticlePositionTexture = widthParticlePositionTexture
    this.heightParticlePositionTexture = heightParticlePositionTexture
  }

  render(particleBuffer: WebGLBuffer): void {
    if (!this.particlePositionTexture) {
      throw new Error(
        'No particle position texture defined, particle renderer was not initialised?',
      )
    }
    const gl = this.program.gl
    this.program.use()

    // We keep the current state of the frame buffer and render the particles on
    // top of it, ignoring alpha for this blending as it has already been taken
    // care of in the texture render.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)

    gl.bindVertexArray(this.vertexArray)
    this.updateParticleTextureFromBuffer(particleBuffer)

    bindTexture(this.program, 'u_particle_texture', 0, this.particleTexture)
    bindTexture(
      this.program,
      'u_particle_position_texture',
      1,
      this.particlePositionTexture,
    )
    this.bindUniforms()

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.numParticles)

    gl.bindVertexArray(null)
  }

  private createParticlePositionTexture(): WebGLTexture {
    const gl = this.program.gl

    const texture = gl.createTexture()
    if (texture === null) {
      throw new Error('Failed to create texture.')
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)

    // We use a 32-bit floating point texture for the particles that we do not
    // want to (and cannot) interpolate, so use nearest neighbour filtering.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    gl.bindTexture(gl.TEXTURE_2D, null)

    return texture
  }

  private updateParticleTextureFromBuffer(particleBuffer: WebGLBuffer): void {
    if (!this.particlePositionTexture) {
      throw new Error(
        'No particle position texture defined, particle renderer was not initialised?',
      )
    }
    const gl = this.program.gl
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, particleBuffer)
    gl.bindTexture(gl.TEXTURE_2D, this.particlePositionTexture)
    const bufferOffset = 0
    // This produces a strange warning in Firefox: "WebGL warning: texImage:
    // Uploads from a buffer with a final row with a byte count smaller than the
    // row stride can incur extra overhead."
    // It seems to have no effect otherwise.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG32F,
      this.widthParticlePositionTexture,
      this.heightParticlePositionTexture,
      0,
      gl.RG,
      gl.FLOAT,
      bufferOffset, // offset into the PIXEL_UNPACK_BUFFER
    )

    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null)
  }

  private bindUniforms(): void {
    const gl = this.program.gl

    // Properties of the texture used to render the particle sprites; rescale
    // particle size to clip coordinates.
    gl.uniform1f(
      this.program.getUniformLocation('u_particle_size'),
      this.particleSize / this.width,
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_aspect_ratio'),
      this.width / this.height,
    )

    // Properties of the data texture used to get the particle positions in the
    // vertex shader.
    gl.uniform1f(
      this.program.getUniformLocation('u_step_x'),
      1.0 / this.widthParticlePositionTexture,
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_step_y'),
      1.0 / this.heightParticlePositionTexture,
    )
    gl.uniform1i(
      this.program.getUniformLocation('u_width'),
      this.widthParticlePositionTexture,
    )
  }
}
