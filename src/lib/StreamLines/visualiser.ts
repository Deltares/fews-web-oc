import particleVertexShaderSource from './shaders/particle.vert.glsl'
import renderVertexShaderSource from './shaders/render.vert.glsl'
import textureVertexShaderSource from './shaders/texture.vert.glsl'
import finalVertexShaderSource from './shaders/final.vert.glsl'

import placeholderFragmentShaderSource from './shaders/placeholder.frag.glsl'
import renderFragmentShaderSource from './shaders/render.frag.glsl'
import textureFragmentShaderSource from './shaders/texture.frag.glsl'
import finalFragmentShaderSource from './shaders/final.frag.glsl'

import { ShaderProgram } from './utils/shaderprogram'
import { createTexture } from './utils/textures'
import {
  StreamlineStyle,
  FinalRenderer,
  ParticlePropagator,
  ParticleRenderer,
  TextureRenderer
} from './render'
import { VelocityImage } from './utils/wms'
import { Colormap } from './utils/colormap'
import { BoundingBoxScaling } from './render/final'

export interface StreamlineVisualiserOptions {
  style: StreamlineStyle
  numEliminatePerSecond: number
  particleSize: number
  speedFactor: number
  fadeAmountPerSecond: number
  maxDisplacement: number
}

export class StreamlineVisualiser {
  private readonly MAX_NUM_SUBSTEPS = 32

  private gl: WebGL2RenderingContext
  private width: number
  private height: number
  private numParticles: number
  private particleTextureSize: number
  private options: StreamlineVisualiserOptions
  private textureRenderer: TextureRenderer | null
  private particlePropagator: ParticlePropagator | null
  private particleRenderer: ParticleRenderer | null
  private finalRenderer: FinalRenderer | null
  private scaling: BoundingBoxScaling
  private previousParticleTexture: WebGLTexture | null
  private currentParticleTexture: WebGLTexture | null
  private isRunning: boolean
  private doReset: boolean
  private velocityImage: VelocityImage | null
  private newVelocityImage: VelocityImage | null
  private frameId: number | null
  private dtMin: number
  private _fps: number

  constructor(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    numParticles: number,
    particleTextureSize: number,
    options: StreamlineVisualiserOptions
  ) {
    this.gl = gl
    this.width = width
    this.height = height
    this.numParticles = numParticles
    this.particleTextureSize = particleTextureSize
    this.options = { ...options }
    this.textureRenderer = null
    this.particlePropagator = null
    this.particleRenderer = null
    this.finalRenderer = null
    this.scaling = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
    this.previousParticleTexture = null
    this.currentParticleTexture = null
    this.isRunning = false
    this.doReset = false
    this.velocityImage = null
    this.newVelocityImage = null
    this.frameId = null
    this.dtMin = 0
    this._fps = 60
  }

  // Compute optimal particle data texture width/height; there are limits to
  // the size of each dimensions of a texture, so to support an acceptable
  // number of particles, we need to store them in a 2D texture, instead of
  // a simple 1D texture.
  private get widthParticlePositionTexture(): number {
    return Math.ceil(Math.sqrt(this.numParticles))
  }
  private get heightParticlePositionTexture(): number {
    return this.widthParticlePositionTexture
  }

  private get numParticlesAllocate(): number {
    return (
      this.widthParticlePositionTexture * this.heightParticlePositionTexture
    )
  }

  get isPlaying(): boolean {
    return this.isRunning
  }

  get fps(): number {
    return this._fps
  }

  get isInitialised(): boolean {
    return (this.particlePropagator !== null &&
      this.particleRenderer !== null &&
      this.finalRenderer !== null)
  }

  initialise(colormap: Colormap): void {
    // Create shader programs for streamline rendering.
    const programUpdateParticles = ShaderProgram.fromShaderSources(
      this.gl,
      particleVertexShaderSource,
      placeholderFragmentShaderSource,
      ['v_position']
    )
    const programRenderParticles = ShaderProgram.fromShaderSources(
      this.gl,
      renderVertexShaderSource,
      renderFragmentShaderSource
    )
    const programRenderTexture = ShaderProgram.fromShaderSources(
      this.gl,
      textureVertexShaderSource,
      textureFragmentShaderSource
    )
    const programRenderFinal = ShaderProgram.fromShaderSources(
      this.gl,
      finalVertexShaderSource,
      finalFragmentShaderSource
    )

    // Create a texture to use as the particle sprite: a filled black circle.
    const particleTexture = this.createParticleTexture()

    // Create and the renderers for the different stages of the visualisation.
    this.textureRenderer = new TextureRenderer(programRenderTexture)
    this.particlePropagator = new ParticlePropagator(
      programUpdateParticles,
      this.width,
      this.height,
      this.numParticles,
      this.numParticlesAllocate,
      this.options.numEliminatePerSecond,
      this.options.speedFactor
    )
    this.particleRenderer = new ParticleRenderer(
      programRenderParticles,
      this.width,
      this.height,
      this.numParticles,
      this.options.particleSize,
      particleTexture,
      this.widthParticlePositionTexture,
      this.heightParticlePositionTexture
    )
    this.finalRenderer = new FinalRenderer(
      programRenderFinal,
      this.options.style,
      colormap
    )

    this.textureRenderer.initialise()
    this.particlePropagator.initialise()
    this.particleRenderer.initialise()
    this.finalRenderer.initialise()

    this.previousParticleTexture = this.createZeroTexture()
    this.currentParticleTexture = this.createZeroTexture()
  }

  start(repaintCallback?: () => void): void {
    if (this.isRunning) return
    this.isRunning = true

    // Approximate average FPS over the last 5 frames.
    const alpha = 0.2

    let previousTimestamp: DOMHighResTimeStamp | null = null
    const render = (timestamp: DOMHighResTimeStamp) => {
      if (this.doReset) {
        this.resetParticleTexture()
        this.doReset = false
      }
      if (this.newVelocityImage !== null) {
        this.updateVelocityImage(this.newVelocityImage)
        this.newVelocityImage = null
      }

      // Only use the first animation frame to determine the start time stamp,
      // do not render.
      if (previousTimestamp === null) {
        previousTimestamp = timestamp
      } else {
        const dt = (timestamp - previousTimestamp) / 1000
        // Compute approximation to a running average of the frame rate.
        this._fps = (1 - alpha) * this._fps + (alpha * 1) / dt
        previousTimestamp = timestamp

        this.renderFrame(dt, repaintCallback)
      }

      this.frameId = window.requestAnimationFrame(render)
    }
    // Start animation.
    this.frameId = window.requestAnimationFrame(render)
  }

  stop(): void {
    this.isRunning = false
    if (this.frameId) window.cancelAnimationFrame(this.frameId)
    this.frameId = null
  }

  reset(): void {
    if (this.isRunning) {
      // If we are running, we can only reset the texture before we render, so
      // it needs to be done from within the render loop. Otherwise, we might
      // get into a weird state by binding a texture during other rendering
      // steps.
      this.doReset = true
    } else {
      // If we are not running, we can just reset the particle texture.
      this.resetParticleTexture()
    }
  }

  setScaling(scaling: BoundingBoxScaling): void {
    this.scaling = scaling
  }

  setDimensions(width: number, height: number): void {
    if (!this.particlePropagator || !this.particleRenderer) {
      throw new Error('Cannot set dimensions for uninitialised visualiser.')
    }
    this.stop()

    this.width = width
    this.height = height

    this.previousParticleTexture = this.createZeroTexture()
    this.currentParticleTexture = this.createZeroTexture()

    this.particlePropagator.setDimensions(width, height)
    this.particleRenderer.setDimensions(width, height)

    // If we have a velocity image, rerender with the new size; reuse the
    // particle locations in clip coordinates.
    if (this.velocityImage) {
      // We need to recompute the time step because our pixel size has changed.
      this.dtMin = this.computeMinimumTimeStep()
    }
  }

  setNumParticles(numParticles: number): void {
    if (!this.particlePropagator || !this.particleRenderer) {
      throw new Error(
        'Cannot set number of particles for uninitialised visualiser.'
      )
    }
    this.stop()
    this.resetParticleTexture()

    this.numParticles = numParticles

    this.particlePropagator.setNumParticles(
      this.numParticles,
      this.numParticlesAllocate
    )
    this.particleRenderer.setNumParticles(
      this.numParticles,
      this.widthParticlePositionTexture,
      this.heightParticlePositionTexture
    )
  }

  setVelocityImage(
    velocityImage: VelocityImage,
    doResetParticles: boolean
  ): void {
    if (this.isRunning) {
      // If we are running, we can only set the velocity image before we render,
      // so it needs to be done from within the render loop. Otherwise, we might
      // get into a weird state by binding a texture during other rendering
      // steps.
      this.newVelocityImage = velocityImage
      this.doReset = doResetParticles
    } else {
      if (doResetParticles) this.resetParticleTexture()
      this.updateVelocityImage(velocityImage)
    }
  }

  updateOptions(options: Partial<StreamlineVisualiserOptions>) {
    if (
      !this.particlePropagator ||
      !this.particleRenderer ||
      !this.finalRenderer
    ) {
      throw new Error('Cannot update options for an uninitialised visualiser.')
    }
    this.options = { ...this.options, ...options }

    if (this.velocityImage) {
      // Use the old minimum time step to compute the new one based on the change
      // in maximum displacement.
      this.dtMin = this.computeMinimumTimeStep()
    }

    this.particlePropagator.numEliminatePerSecond =
      this.options.numEliminatePerSecond

    this.particlePropagator.speedFactor = this.options.speedFactor
    this.particleRenderer.particleSize = this.options.particleSize

    this.finalRenderer.style = this.options.style
  }

  private renderFrame(dt: number, repaintCallback?: () => void) {
    if (
      !this.textureRenderer ||
      !this.particlePropagator ||
      !this.particleRenderer ||
      !this.finalRenderer ||
      !this.previousParticleTexture ||
      !this.currentParticleTexture
    ) {
      throw new Error(
        'Visualiser was not initialised before attempting to render frame.'
      )
    }

    // Check whether we need to do any substepping.
    const needSubstepping = dt > this.dtMin
    // Never do more than a certain number of substeps.
    const numSubSteps = needSubstepping
      ? Math.min(Math.floor(dt / this.dtMin), this.MAX_NUM_SUBSTEPS)
      : 1
    const dtSub = needSubstepping ? dt / numSubSteps : dt
    for (let i = 0; i < numSubSteps; i++) {
      // Render the previous particle frame (i.e. a frame with only the
      // particles, not velocity magnitude colours) to a texture, fading it by
      // an amount proportional to the current time step.
      let fadeAmount = this.options.fadeAmountPerSecond * dtSub
      // We render the alpha channel with 8-bit precision, so we cannot
      // represent amounts below 1/255. If our fade amount is below this number,
      // randomly fade the texture by 1/255, with a probability proportional to
      // the desired fade amount.
      const fadeAmountMin = 1/255
      if (fadeAmount < fadeAmountMin) {
        const fadeProbability = fadeAmount / fadeAmountMin
        fadeAmount = Math.random() < fadeProbability ? fadeAmountMin : 0
      }
      this.textureRenderer.render(
        this.previousParticleTexture,
        fadeAmount,
        this.currentParticleTexture
      )

      // Update the particle positions into an output buffer.
      this.particlePropagator.update(dtSub)

      // Use the updated particle position to render sprites at those locations.
      // These particles are rendered on top of the previous particle frame to
      // produce the fading "comet trails".
      this.particleRenderer.render(this.particlePropagator.buffer)

      // Do not swap at the last time step as we need the latest particle
      // texture for the final render.
      if (i < numSubSteps - 1) this.swapParticleTextures()
    }

    // Finally, render the velocity magnitude with the particles (and trails)
    // blended with it.
    if (repaintCallback) repaintCallback()
    this.finalRenderer.render(this.currentParticleTexture, this.scaling)

    // Swap previous and current particle texture.
    this.swapParticleTextures()
  }

  private computeMinimumTimeStep(): number {
    if (!this.velocityImage) {
      throw new Error(
        'Cannot compute minimum time step if velocity image was not set.'
      )
    }
    // Maximum displacement in clip coordinates.
    const maxDisplacementX = this.options.maxDisplacement / this.width
    const maxDisplacementY = this.options.maxDisplacement / this.height

    // Compute maximum velocity in clip coordinates.
    const [maxU, maxV] = this.velocityImage.maxVelocity()
    const maxUClip =
      ((maxU * this.width) / this.height) * this.options.speedFactor
    const maxVClip = maxV * this.options.speedFactor

    // Compute time step such that the maximum velocity results in the maximum
    // acceptable displacement.
    const dtMinU = maxDisplacementX / maxUClip
    const dtMinV = maxDisplacementY / maxVClip
    return Math.min(dtMinU, dtMinV)
  }

  private createParticleTexture(): WebGLTexture {
    const radius = 0.5 * this.particleTextureSize
    const width = this.particleTextureSize
    const height = this.particleTextureSize
    const canvas = new OffscreenCanvas(width, height)
    const context  = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null
    if (context === null) {
      throw new Error('Could not initialise 2D offscreen canvas.')
    }

    context.beginPath()
    const x = radius
    const y = radius
    context.arc(x, y, radius, 0, 2 * Math.PI, false)
    context.fillStyle = 'black'
    context.fill()

    const data = context.getImageData(0, 0, width, height).data
    return createTexture(this.gl, this.gl.LINEAR, data, width, height)
  }

  private createZeroTexture(): WebGLTexture {
    // Create texture initialised to zeros.
    const zeros = new Uint8Array(this.width * this.height * 4)
    return createTexture(this.gl, this.gl.LINEAR, zeros, this.width, this.height)
  }

  private swapParticleTextures(): void {
    const temp = this.previousParticleTexture
    this.previousParticleTexture = this.currentParticleTexture
    this.currentParticleTexture = temp
  }

  private resetParticleTexture(): void {
    this.previousParticleTexture = this.createZeroTexture()
  }

  private updateVelocityImage(velocityImage: VelocityImage): void {
    if (!this.particlePropagator || !this.finalRenderer) {
      throw new Error('Cannot set velocity image for uninitialised visualiser.')
    }
    this.velocityImage = velocityImage
    this.particlePropagator.setVelocityImage(velocityImage)
    this.finalRenderer.setVelocityImage(velocityImage)
    this.dtMin = this.computeMinimumTimeStep()
  }
}
