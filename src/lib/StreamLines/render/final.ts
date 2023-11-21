import { Colormap } from '../utils/colormap'
import { createRectangleVertexArray } from '../utils/geometry'
import { ShaderProgram, bindTexture } from '../utils/shaderprogram'
import { VelocityImage } from '../utils/wms'

export interface BoundingBoxScaling {
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
}

export enum StreamlineStyle {
  LightParticlesOnMagnitude = 0,
  DarkParticlesOnMagnitude = 1,
  MagnitudeColoredParticles = 2
}

export class FinalRenderer {
  private static readonly NUM_SEGMENTS_COLORMAP = 64

  public style: StreamlineStyle

  private program: ShaderProgram
  private vertexArray: WebGLVertexArrayObject | null
  private velocityImage: VelocityImage | null
  private colormap: Colormap
  private colormapTexture: WebGLTexture | null
  private velocityTexture: WebGLTexture | null

  constructor(
    program: ShaderProgram,
    style: StreamlineStyle,
    colormap: Colormap
  ) {
    this.program = program
    this.style = style
    this.vertexArray = null
    this.velocityImage = null
    this.colormap = colormap
    this.colormapTexture = null
    this.velocityTexture = null
  }

  initialise(): void {
    const gl = this.program.gl
    this.vertexArray = createRectangleVertexArray(
      this.program,
      -1.0,
      1.0,
      -1.0,
      1.0,
      'a_position',
      'a_tex_coord'
    )
    this.colormapTexture = this.colormap.toTexture(gl, FinalRenderer.NUM_SEGMENTS_COLORMAP)
  }

  render(particleTexture: WebGLTexture, scaling: BoundingBoxScaling): void {
    const gl = this.program.gl
    this.program.use()

    gl.bindVertexArray(this.vertexArray)

    this.bindUniforms(scaling)
    this.bindTextures(particleTexture)

    // Make sure no framebuffer is bound so we render to the canvas.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    // Make sure that we blend with any previous renders on the frame buffer
    // appropriately.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  setVelocityImage(velocityImage: VelocityImage) {
    this.velocityImage = velocityImage
    this.velocityTexture = velocityImage.toTexture(this.program.gl, false)
  }

  setColorMap(colormap: Colormap) {
    this.colormap = colormap
    this.colormapTexture = this.colormap.toTexture(this.program.gl, FinalRenderer.NUM_SEGMENTS_COLORMAP)
  }

  private bindUniforms(scaling: BoundingBoxScaling): void {
    if (!this.velocityImage) {
      throw new Error(
        'Velocity image is not defined, no velocity image was set?'
      )
    }
    const gl = this.program.gl

    // Scaling parameters for the bounding box.
    gl.uniform1f(
      this.program.getUniformLocation('u_bbox_scale_x'),
      scaling.scaleX
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_bbox_scale_y'),
      scaling.scaleY
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_bbox_offset_x'),
      scaling.offsetX
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_bbox_offset_y'),
      scaling.offsetY
    )

    // Uniform to set the render style, its values correspond to the values
    // of the StreamlineStyle enum.
    gl.uniform1i(
      this.program.getUniformLocation('u_style'),
      this.style
    )

    // Uniforms for the start and end of the colormap.
    gl.uniform1f(
      this.program.getUniformLocation('u_colormap_start'),
      this.colormap.start
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_colormap_end'),
      this.colormap.end
    )

    // Uniforms for correctly scaling the velocity.
    gl.uniform1f(
      this.program.getUniformLocation('u_u_scale'),
      this.velocityImage.uScale
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_v_scale'),
      this.velocityImage.vScale
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_u_offset'),
      this.velocityImage.uOffset
    )
    gl.uniform1f(
      this.program.getUniformLocation('u_v_offset'),
      this.velocityImage.vOffset
    )
  }

  private bindTextures(particleTexture: WebGLTexture): void {
    if (this.colormapTexture === null || this.velocityTexture === null) {
      throw new Error('Textures have not been initialised.')
    }
    bindTexture(this.program, 'u_particle_texture', 0, particleTexture)
    bindTexture(this.program, 'u_colormap_texture', 1, this.colormapTexture)
    bindTexture(this.program, 'u_velocity_texture', 2, this.velocityTexture)
  }
}
