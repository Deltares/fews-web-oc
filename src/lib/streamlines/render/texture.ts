import { createRectangleVertexArray } from '../utils/geometry'
import { ShaderProgram, bindTexture } from '../utils/shaderprogram'

export class TextureRenderer {
  private program: ShaderProgram
  private positionBuffer: WebGLBuffer | null
  private texCoordBuffer: WebGLBuffer | null
  private vertexArray: WebGLVertexArrayObject | null
  private frameBuffer: WebGLFramebuffer | null

  constructor(program: ShaderProgram) {
    this.program = program

    this.positionBuffer = null
    this.texCoordBuffer = null
    this.vertexArray = null
    this.frameBuffer = null
  }

  initialise(): void {
    const [positionBuffer, texCoordBuffer, vertexArray] =
      createRectangleVertexArray(
        this.program,
        -1.0,
        1.0,
        -1.0,
        1.0,
        'a_position',
        'a_tex_coord',
      )
    this.positionBuffer = positionBuffer
    this.texCoordBuffer = texCoordBuffer
    this.vertexArray = vertexArray
    this.frameBuffer = this.program.gl.createFramebuffer()
  }

  destruct(): void {
    const gl = this.program.gl
    gl.deleteBuffer(this.positionBuffer)
    gl.deleteBuffer(this.texCoordBuffer)
    gl.deleteVertexArray(this.vertexArray)
    gl.deleteFramebuffer(this.frameBuffer)
    this.program.destruct()
  }

  render(
    inputTexture: WebGLTexture,
    fadeAmount: number,
    outputTexture: WebGLTexture | null,
  ): void {
    const gl = this.program.gl
    this.program.use()

    gl.bindVertexArray(this.vertexArray)
    bindTexture(this.program, 'u_texture', 0, inputTexture)
    gl.uniform1f(this.program.getUniformLocation('u_fade_amount'), fadeAmount)
    // Flip y-axis if we are rendering to texture, as it is otherwise flipped
    // compared to rendering to canvas.
    gl.uniform1f(
      this.program.getUniformLocation('u_flip'),
      outputTexture ? -1.0 : 1.0,
    )

    if (outputTexture) {
      this.enableRenderToTexture(outputTexture)
    } else {
      this.disableRenderToTexture()
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.bindVertexArray(null)
  }

  private enableRenderToTexture(outputTexture: WebGLTexture): void {
    if (this.frameBuffer === null) {
      throw new Error('Framebuffer has not been initialised.')
    }
    const gl = this.program.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      outputTexture,
      0,
    )
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.BLEND)
  }

  private disableRenderToTexture(): void {
    const gl = this.program.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
}
