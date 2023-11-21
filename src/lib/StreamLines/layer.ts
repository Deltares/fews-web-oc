import {
  CustomLayerInterface,
  LngLat,
  LngLatBounds,
  Map,
  MercatorCoordinate
} from 'mapbox-gl'
import {
  BoundingBoxScaling,
  StreamlineStyle,
  StreamlineVisualiser,
  StreamlineVisualiserOptions,
  fetchWMSAvailableTimesAndElevations,
  fetchWMSColormap,
  fetchWMSVelocityField
} from '.'

export interface WMSStreamlineLayerOptions {
  baseUrl: string
  layer: string
  style: string
  streamlineStyle: StreamlineStyle
  numParticles: number
  particleSize: number
  speedFactor: number
  fadeAmountPerSecond: number
  colorScaleRange?: string
  downsampleFactorWMS?: number
}

function mapBoundsToEpsg3857BoundingBox(
  bounds: LngLatBounds
): [number, number, number, number] {
  // Converts weird normalised EPSG:3857 to actual EPSG:3857.
  const toMercator = (coords: LngLat) => {
    // TODO: get magic number from MapBox somehow; mercator
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
  public static readonly MAX_PARTICLE_DISPLACEMENT = 2
  private static readonly PARTICLE_TEXTURE_SIZE = 8

  public readonly id = 'wms-streamline-custom-layer'
  public readonly renderingMode = '2d'
  public readonly type = 'custom'

  private map: Map | null
  private gl: WebGL2RenderingContext | null

  private options: WMSStreamlineLayerOptions
  private visualiser: StreamlineVisualiser | null

  private boundingBoxWMS: [number, number, number, number] | null
  private _elevation: number | undefined
  private _elevationBounds: [number, number] | null
  private _colorScaleRange: string | undefined

  private _times: string[]
  private _timeIndex: number

  private onLoad: (() => void) | null

  constructor(options: WMSStreamlineLayerOptions) {
    this.map = null
    this.gl = null

    this.options = options
    this.visualiser = null

    this.boundingBoxWMS = null
    this._elevationBounds = null

    this._colorScaleRange = this.options.colorScaleRange

    this._times = []
    this._timeIndex = 0

    this.onLoad = null
  }

  get times(): string[] {
    return this._times
  }

  get timeIndex(): number {
    return this._timeIndex
  }

  get time(): string {
    return this._times[this._timeIndex]
  }

  get elevation(): number | undefined {
    return this._elevation
  }

  get colorScaleRange(): string | undefined {
    return this._colorScaleRange
  }

  get fps(): number {
    return this.visualiser?.fps ?? 0
  }

  get parent(): Map | null {
    return this.map
  }

  get visualiserInitialised(): boolean {
    return this.visualiser !== null && this.visualiser.isInitialised
  }

  private get size(): [number, number] {
    if (!this.gl) throw new Error('Not initialised.')
    // const width = this.gl
    const width = this.gl.drawingBufferWidth
    const height = this.gl.drawingBufferHeight
    return [width, height]
  }

  async onAdd(map: Map, gl: WebGL2RenderingContext) {
    this.map = map
    this.gl = gl

    this.visualiser = this.createVisualiser(
      gl,
      this.options.numParticles,
      this.options.streamlineStyle,
      this.options.particleSize,
      this.options.speedFactor,
      this.options.fadeAmountPerSecond
    )

    this._times = []
    this._timeIndex = 0
    this._elevationBounds = null

    // Fetch colormap and use it to initialise the visualiser.
    const colormap = await fetchWMSColormap(
      this.options.baseUrl,
      this.options.layer,
      this.options.colorScaleRange
    )
    this.visualiser.initialise(colormap)

    // Fetch available WMS times, then set the current WMS time to the first
    // available time.
    const response = await fetchWMSAvailableTimesAndElevations(
      this.options.baseUrl,
      this.options.layer
    )
    this._times = response.times
    this._elevationBounds = response.elevationBounds

    await this.onMapBoundsChange(false)

    this.map
      .on('moveend',  this.onMapMove)
      .on('resize', this.onResize)

    if (this.onLoad) this.onLoad()
  }

  render(): void {
    if (!this.map || !this.boundingBoxWMS) return

    const [xSWCur, ySWCur, xNECur, yNECur] = mapBoundsToEpsg3857BoundingBox(
      this.map.getBounds()
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
      offsetX: -2 * (xCentreCur - xCentreWMS) / widthCur,
      offsetY: -2 * (yCentreCur - yCentreWMS) / heightCur
    }
    this.visualiser?.setScaling(scaling)
  }

  onRemove(): void {
    this.visualiser?.stop()
    if (this.map !== null) {
      this.map
      .off('moveend', this.onMapMove)
      .off('resize', this.onResize)
    }
    this.visualiser = null
  }

  setTimeIndex(index: number): void {
    if (index < 0 || index > this.times.length - 1) {
      throw new Error('Invalid time index.')
    }
    this._timeIndex = index
  }

  setElevation(elevation: number): void {
    if (this._elevationBounds === null || elevation < this._elevationBounds[0] || elevation > this._elevationBounds[1]) {
      throw new Error('Invalid elevation.')
    }
    this._elevation = elevation
  }

  async updateLayer(timeIndex?: number, elevation?: number, colorScaleRange?: string): Promise<void> {
    if (timeIndex === undefined && elevation === undefined) return
    if (timeIndex !== undefined) {
      this.setTimeIndex(timeIndex)
    }
    if (elevation !== undefined) {
      this.setElevation(elevation)
    }
    if (colorScaleRange !== undefined) {
      this._colorScaleRange = colorScaleRange
    }
    await this.onMapBoundsChange(false)
  }

  updateNumParticles(numParticles: number): void {
    if (!this.visualiser) throw new Error('Not initialised.')
    this.visualiser.setNumParticles(numParticles)
    this.visualiser.updateOptions({
      numEliminatePerSecond: numParticles
    })
    // Changing the number of particles will stop the animation, so restart it.
    this.visualiser.start()
  }

  updateVisualiserOptions(options: Partial<StreamlineVisualiserOptions>): void {
    if (!this.visualiser) throw new Error('Not initialised.')
    this.visualiser.updateOptions(options)
  }

  on(_: 'load', callback: () => void): void {
    this.onLoad = callback
  }

  private createVisualiser(
    gl: WebGL2RenderingContext,
    numParticles: number,
    style: StreamlineStyle,
    particleSize: number,
    speedFactor: number,
    fadeAmountPerSecond: number
  ): StreamlineVisualiser {
    if (!this.map) throw new Error('Not initialised.')

    const [width, height] = this.size
    const options: StreamlineVisualiserOptions = {
      style,
      numEliminatePerSecond: numParticles,
      particleSize,
      speedFactor,
      fadeAmountPerSecond,
      maxDisplacement: WMSStreamlineLayer.MAX_PARTICLE_DISPLACEMENT
    }
    return new StreamlineVisualiser(
      gl,
      width,
      height,
      numParticles,
      WMSStreamlineLayer.PARTICLE_TEXTURE_SIZE,
      options
    )
  }

  private async onMapResize(): Promise<void> {
    if (!this.visualiser) throw new Error('Not initialised')
    // Update the canvas size and dimensions for the visualiser.
    const [width, height] = this.size
    this.visualiser.setDimensions(width, height)

    // Fetch a new WMS picture for the new size.
    await this.onMapBoundsChange(true)
  }

  onResize = (event: Event) => {
    this.onMapResize()
  }

  onMapMove = (event: DragEvent) => {
    this.onMapBoundsChange(true)
  }

  private async onMapBoundsChange(doResetParticles: boolean): Promise<void> {
    if (!this.map || !this.visualiser) throw new Error('Not initialised')

    // Make sure to get the bounds before we start the long wait for the WMS
    // layer, since the user may have moved the map while this fetch is
    // happening; this would cause the newly fetched WMS image to be placed at
    // the wrong coordinates.
    const boundingBox = mapBoundsToEpsg3857BoundingBox(this.map.getBounds())

    // Get WMS bounding box (EPSG:3857) for the current map bounds.
    const [width, height] = this.size

    const downsampleDimension = (length: number) => {
      const divisor = this.options.downsampleFactorWMS ?? 1
      return Math.round(length / divisor)
    }
    const widthWMS = downsampleDimension(width)
    const heightWMS = downsampleDimension(height)

    const velocityImage = await fetchWMSVelocityField(
      this.options.baseUrl,
      this.options.layer,
      this.options.style,
      this.time,
      boundingBox,
      widthWMS,
      heightWMS,
      this.elevation,
      this.colorScaleRange
    )

    if (this.visualiser !== null) {
      // Stop the animation and clear the frame to prevent jarring flashes while
      // the canvas is repositioned.
      this.visualiser.stop()

      this.boundingBoxWMS = boundingBox
      this.visualiser.setVelocityImage(velocityImage, doResetParticles)
      const colormap = await fetchWMSColormap(
        this.options.baseUrl,
        this.options.layer,
        this.colorScaleRange
      )
      this.visualiser.updateColorMap(colormap)
      // Start the animation if it is not yet running; start is a no-op if the
      // animation is already running.
      this.visualiser.start(() => this.map?.triggerRepaint())
    }
  }
}
