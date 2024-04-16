import debounce from 'lodash-es/debounce'
import {
  CustomLayerInterface,
  LngLat,
  LngLatBounds,
  Map,
  MercatorCoordinate,
} from 'maplibre-gl'
import {
  BoundingBoxScaling,
  StreamlineStyle,
  StreamlineVisualiser,
  StreamlineVisualiserOptions,
  fetchWMSAvailableTimesAndElevations,
  fetchWMSColormap,
  fetchWMSVelocityField,
} from '.'

export interface WMSStreamlineLayerOptions {
  baseUrl: string
  layer: string
  style?: string
  useDisplayUnits?: boolean
  streamlineStyle: StreamlineStyle
  numParticles: number
  particleSize: number
  speedFactor: number
  fadeAmountPerSecond: number
  downsampleFactorWMS?: number
  particleColor?: string
}

function mapBoundsToEpsg3857BoundingBox(
  bounds: LngLatBounds,
): [number, number, number, number] {
  // Converts weird normalised EPSG:3857 to actual EPSG:3857.
  const toMercator = (coords: LngLat) => {
    // TODO: get magic number from Maplibre somehow; mercator
    const mercatorWidth = 2 * 20037508.34
    const mercNorm = MercatorCoordinate.fromLngLat(coords)
    const x = (mercNorm.x - 0.5) * mercatorWidth
    const y = (0.5 - mercNorm.y) * mercatorWidth
    return [x, y]
  }
  const [xSW, ySW] = toMercator(bounds.getSouthWest())
  const [xNE, yNE] = toMercator(bounds.getNorthEast())

  return [xSW, ySW, xNE, yNE]
}

export class WMSStreamlineLayer implements CustomLayerInterface {
  private static readonly MAX_PARTICLE_DISPLACEMENT = 2
  private static readonly PARTICLE_TEXTURE_SIZE = 32

  public readonly renderingMode = '2d'
  public readonly type = 'custom'

  private _id: string

  private map: Map | null
  private gl: WebGL2RenderingContext | null

  private options: WMSStreamlineLayerOptions
  private visualiser: StreamlineVisualiser | null
  private previousFrameTime: DOMHighResTimeStamp | null

  private boundingBoxWMS: [number, number, number, number] | null

  private times: string[]
  private elevationBounds: [number, number] | null

  private timeIndex: number
  private elevation: number | null
  private colorScaleRange: [number, number] | null

  private isInitialised: boolean
  private abortController: AbortController

  private onLayerAdd: (() => void) | null
  // Pause rendering during map resizes; rendering will be continued by the
  // newly fetched velocity field.
  private onResizeStart = () => this.visualiser?.stop()
  // Map moveend events are fired during resize animations, so we debounce the
  // callback to prevent too many velocity field updates from happening.
  private onMapMoveEnd = debounce(() => this.updateVelocityField(true), 100)

  constructor(id: string, options: WMSStreamlineLayerOptions) {
    this._id = id

    this.map = null
    this.gl = null

    this.options = options
    this.visualiser = null
    this.previousFrameTime = null

    this.boundingBoxWMS = null

    this.times = []
    this.elevationBounds = null

    this.timeIndex = 0
    this.elevation = null
    this.colorScaleRange = null

    this.isInitialised = false
    this.abortController = new AbortController()

    this.onLayerAdd = null
  }

  get id(): string {
    return this._id
  }

  private get signal(): AbortSignal {
    return this.abortController.signal
  }

  private get time(): string {
    if (this.times.length === 0) {
      throw new Error('No available times.')
    }
    return this.times[this.timeIndex]
  }

  private get size(): [number, number] {
    if (!this.gl) throw new Error('Not initialised.')
    const width = this.gl.drawingBufferWidth
    const height = this.gl.drawingBufferHeight
    return [width, height]
  }

  onAdd(map: Map, gl: WebGL2RenderingContext) {
    this.map = map
    this.gl = gl

    this.visualiser = this.createVisualiser(gl, this.options)

    this.times = []
    this.elevationBounds = null

    this.timeIndex = 0
    this.elevation = null
    this.colorScaleRange = null

    if (this.onLayerAdd) {
      this.onLayerAdd()
      this.onLayerAdd = null
    }
  }

  onRemove(): void {
    // Abort any ongoing updates to the layer. This prevents map event listeners
    // from being set after the layer has been removed from the map.
    this.abortController.abort()
    this.map
      ?.off('resize', this.onResizeStart)
      .off('moveend', this.onMapMoveEnd)
    this.visualiser?.destruct()
    this.visualiser = null
    this.previousFrameTime = null
  }

  render(): void {
    if (!this.map || !this.boundingBoxWMS || !this.visualiser) {
      return
    }

    const [xSWCur, ySWCur, xNECur, yNECur] = mapBoundsToEpsg3857BoundingBox(
      this.map.getBounds(),
    )
    const [xSWWMS, ySWWMS, xNEWMS, yNEWMS] = this.boundingBoxWMS

    // Compute offset and scale of the new bounding box compared to the old one.
    // This is used to determine where to render the streamline visualisation in
    // clip coordinates.
    const widthWMS = xNEWMS - xSWWMS
    const widthCur = xNECur - xSWCur
    const heightWMS = yNEWMS - ySWWMS
    const heightCur = yNECur - ySWCur

    // Compute the offset based on the centre of the bounding box.
    const xCentreCur = 0.5 * (xSWCur + xNECur)
    const yCentreCur = 0.5 * (ySWCur + yNECur)
    const xCentreWMS = 0.5 * (xSWWMS + xNEWMS)
    const yCentreWMS = 0.5 * (ySWWMS + yNEWMS)

    const scaling: BoundingBoxScaling = {
      scaleX: widthWMS / widthCur,
      scaleY: heightWMS / heightCur,
      offsetX: (-2 * (xCentreCur - xCentreWMS)) / widthCur,
      offsetY: (-2 * (yCentreCur - yCentreWMS)) / heightCur,
    }
    this.visualiser?.setScaling(scaling)

    // Determine time elapsed between this frame and the previous frame.
    const now = performance.now()
    const dt = this.previousFrameTime
      ? (now - this.previousFrameTime) / 1000
      : 1 / 60
    this.previousFrameTime = now

    // Render the streamline visualisation.
    this.visualiser?.renderFrame(dt)

    // Request a new frame from Maplibre, apparently (surprising API...).
    this.map.triggerRepaint()
  }

  once(_: 'add', callback: () => void): void {
    this.onLayerAdd = callback
  }

  async waitForInitialisation(signal?: AbortSignal): Promise<boolean> {
    return new Promise((resolve) => {
      const checkInitialisation = async () => {
        if (this.isInitialised) return resolve(true)
        // The layer may have been removed; fetches have been aborted so we will
        // never be initialised.
        if (this.signal.aborted) return resolve(false)
        // If we have an abort signal, waiting for initialisation may have been
        // aborted.
        if (signal?.aborted) return resolve(false)

        // If the layer is not yet initialised or aborted, wait a bit and check
        // again.
        window.setTimeout(checkInitialisation, 50)
      }
      checkInitialisation()
    })
  }

  async initialise(
    time: Date,
    elevation?: number,
    colorScaleRange?: [number, number],
  ): Promise<void> {
    if (!this.visualiser || !this.map) throw new Error('Not added to a map.')

    // Fetch colormap and use it to initialise the visualiser.
    const colormap = await fetchWMSColormap(
      this.options.baseUrl,
      this.options.layer,
      colorScaleRange,
      this.signal,
    )
    this.visualiser.initialise(colormap)

    // Fetch available WMS times and elevations.
    const response = await fetchWMSAvailableTimesAndElevations(
      this.options.baseUrl,
      this.options.layer,
      this.signal,
    )
    this.times = response.times
    this.elevationBounds = response.elevationBounds

    this.timeIndex = this.findTimeIndex(time)
    this.elevation = elevation ?? null
    this.colorScaleRange = colorScaleRange ?? null

    // Fetch first velocity field; this will also enable rendering.
    await this.updateVelocityField(true)

    // Register event listeners for map changes. This will also be called when
    // the map is resized. Make sure we do not add the listener if we have
    // already aborted any requests because the layer is being removed.
    if (this.signal.aborted) return
    this.map.on('resize', this.onResizeStart).on('moveend', this.onMapMoveEnd)

    this.isInitialised = true

    // Request a repaint to ensure we see the velocity field.
    this.map.triggerRepaint()
  }

  async setTime(time: Date): Promise<void> {
    await this.setTimeIndex(this.findTimeIndex(time))
  }

  async setTimeIndex(index: number): Promise<void> {
    // No change, do not update.
    if (index === this.timeIndex) return

    if (index < 0 || index > this.times.length - 1) {
      throw new Error('Invalid time index.')
    }
    this.timeIndex = index
    // The velocity field update is abortable.
    await this.updateVelocityField(true)
  }

  async setElevation(elevation: number | null): Promise<void> {
    // No change, do not update.
    if (elevation === this.elevation) return

    if (elevation === null) {
      this.elevation = null
    } else {
      if (
        this.elevationBounds === null ||
        elevation < this.elevationBounds[0] ||
        elevation > this.elevationBounds[1]
      ) {
        throw new Error('Invalid elevation.')
      }
      this.elevation = elevation
    }
    // The velocity field update is abortable.
    await this.updateVelocityField(true)
  }

  async setColorScaleRange(
    colorScaleRange: [number, number] | null,
  ): Promise<void> {
    // No change, do not update.
    if (colorScaleRange === null && this.colorScaleRange === null) return
    if (
      colorScaleRange !== null &&
      this.colorScaleRange !== null &&
      colorScaleRange[0] === this.colorScaleRange[0] &&
      colorScaleRange[1] === this.colorScaleRange[1]
    ) {
      return
    }

    this.colorScaleRange = colorScaleRange

    // Update colormap and velocity field for new color scale range.
    const colormap = await fetchWMSColormap(
      this.options.baseUrl,
      this.options.layer,
      colorScaleRange ?? undefined,
      this.signal,
    )
    this.visualiser?.setColorMap(colormap)

    // Note that we do not need a velocity update, since the TIFF response from
    // the WMS server does not depend on the color scale range.
  }

  setNumParticles(numParticles: number): void {
    this.visualiser?.setNumParticles(numParticles)
    this.visualiser?.updateOptions({
      numEliminatePerSecond: numParticles,
    })
  }

  setVisualiserOptions(options: Partial<StreamlineVisualiserOptions>): void {
    this.visualiser?.updateOptions(options)
  }

  private createVisualiser(
    gl: WebGL2RenderingContext,
    options: WMSStreamlineLayerOptions,
  ): StreamlineVisualiser {
    if (!this.map) throw new Error('Not initialised.')

    const visualiserOptions =
      WMSStreamlineLayer.getVisualiserOptionsFromLayerOptions(options)
    const [width, height] = this.size
    return new StreamlineVisualiser(
      gl,
      width,
      height,
      this.options.numParticles,
      WMSStreamlineLayer.PARTICLE_TEXTURE_SIZE,
      visualiserOptions,
    )
  }

  private async updateVelocityField(doResetParticles: boolean): Promise<void> {
    if (!this.map) throw new Error('Not added to a map')

    // Update the canvas size and dimensions for the visualiser. This is no-op
    // if the size has not changed.
    const [width, height] = this.size
    this.visualiser?.setDimensions(width, height)
    // Restart animation after setting the dimensions, so we can still show
    // some animation after resizing the canvas, with the old velocity field.
    this.visualiser?.start()

    // Make sure to get the bounds before we start the long wait for the WMS
    // layer, since the user may have moved the map while this fetch is
    // happening; this would cause the newly fetched WMS image to be placed at
    // the wrong coordinates.
    const boundingBox = mapBoundsToEpsg3857BoundingBox(this.map.getBounds())

    const downsampleDimension = (length: number) => {
      const divisor = this.options.downsampleFactorWMS ?? 1
      return Math.round(length / divisor)
    }
    const widthWMS = downsampleDimension(width)
    const heightWMS = downsampleDimension(height)

    try {
      const velocityImage = await fetchWMSVelocityField(
        this.options.baseUrl,
        this.options.layer,
        this.time,
        boundingBox,
        widthWMS,
        heightWMS,
        this.options.style,
        this.options.useDisplayUnits,
        this.elevation ?? undefined,
        this.signal,
      )
      this.visualiser?.setVelocityImage(velocityImage, doResetParticles)
    } catch (error) {
      // No error message is necessary if the promise gets rejected due to an
      // abort.
      if (!this.signal.aborted) {
        console.error(
          'Failed to fetch WMS velocity field, or received empty image.',
        )
      }
      this.visualiser?.stop()
      this.boundingBoxWMS = null
      return
    }

    this.visualiser?.start()
    this.boundingBoxWMS = boundingBox

    // Request a repaint from Maplibre so we (re)start the animation.
    this.map.triggerRepaint()
  }

  private findTimeIndex(time: Date): number {
    // Find the closest date to the requested date.
    const timestamps = this.times.map((cur) => new Date(cur).getTime())
    const timestamp = time.getTime()
    const diffs = timestamps.map((cur) => Math.abs(timestamp - cur))
    const minDiff = Math.min(...diffs)
    return diffs.findIndex((diff) => diff == minDiff) ?? 0
  }

  private static getVisualiserOptionsFromLayerOptions(
    options: WMSStreamlineLayerOptions,
  ): StreamlineVisualiserOptions {
    return {
      style: options.streamlineStyle,
      numEliminatePerSecond: options.numParticles,
      particleSize: options.particleSize,
      speedFactor: options.speedFactor,
      fadeAmountPerSecond: options.fadeAmountPerSecond,
      maxDisplacement: WMSStreamlineLayer.MAX_PARTICLE_DISPLACEMENT,
      particleColor: options.particleColor,
    }
  }
}
