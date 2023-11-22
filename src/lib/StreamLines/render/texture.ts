import { createRectangleVertexArray } from '../utils/geometry'
import { ShaderProgram, bindTexture } from '../utils/shaderprogram'

export class TextureRenderer {
  private program: ShaderProgram
  private vertexArray: WebGLVertexArrayObject | null
  private frameBuffer: WebGLFramebuffer | null

  constructor(program: ShaderProgram) {
    this.program = program

    this.vertexArray = null
    this.frameBuffer = null
  }

  initialise(): void {
    this.vertexArray = createRectangleVertexArray(
      this.program,
      -1.0,
      1.0,
      -1.0,
      1.0,
      'a_position',
      'a_tex_coord'
    )
    this.frameBuffer = this.program.gl.createFramebuffer()
  }

  render(
    inputTexture: WebGLTexture,
    fadeAmount: number,
    outputTexture: WebGLTexture | null
  ): void {
    const gl = this.program.gl
    this.program.use()

    gl.disable(gl.BLEND)

    gl.bindVertexArray(this.vertexArray)
    bindTexture(this.program, 'u_texture', 0, inputTexture)
    gl.uniform1f(this.program.getUniformLocation('u_fade_amount'), fadeAmount)
    // Flip y-axis if we are rendering to texture, as it is otherwise flipped
    // compared to rendering to canvas.
    gl.uniform1f(
      this.program.getUniformLocation('u_flip'),
      outputTexture ? -1.0 : 1.0
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
      0
    )
  }

  private disableRenderToTexture(): void {
    const gl = this.program.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
}
