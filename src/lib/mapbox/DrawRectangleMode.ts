import {
  DrawCustomModeThis,
  DrawCustomMode,
  MapMouseEvent,
  DrawActionableState,
  MapTouchEvent,
  DrawPolygon,
} from '@mapbox/mapbox-gl-draw'
import type { GeoJSON } from 'geojson'

interface State {
  startPoint?: [number, number]
  endPoint?: [number, number]
  rectangle: DrawPolygon
}

const doubleClickZoom = {
  enable: (ctx: any) => {
    setTimeout(() => {
      ctx?.map?.doubleClickZoom?.enable?.()
    })
  },
  disable: (ctx: DrawCustomModeThis) => {
    setTimeout(() => {
      ctx?.map?.doubleClickZoom?.disable?.()
    })
  },
}

const DrawRectangle: DrawCustomMode = {
  onSetup(this: DrawCustomModeThis, opts: any) {
    const rectangle = this.newFeature({
      type: 'Feature',
      properties: {
        noActiveFeature: true,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[]],
      },
    })

    this.addFeature(rectangle)
    this.clearSelectedFeatures()
    doubleClickZoom.disable(this)
    this.updateUIClasses({ mouse: 'add' })
    this.setActionableState({
      trash: true,
    } as DrawActionableState)

    return {
      rectangle,
    }
  },

  onTap(this: any, state: State, e: MapTouchEvent) {
    if (state.startPoint) {
      this.onMouseMove(state, e)
    }

    this.onClick(state, e)
  },

  onClick(this: DrawCustomModeThis, state: State, e: MapMouseEvent) {
    if (
      state.startPoint &&
      (state.startPoint[0] !== e.lngLat.lng ||
        state.startPoint[1] !== e.lngLat.lat)
    ) {
      this.updateUIClasses({ mouse: 'pointer' })
      state.endPoint = [e.lngLat.lng, e.lngLat.lat]
      this.changeMode('simple_select', { featuresId: state.rectangle.id })
    }

    state.startPoint = [e.lngLat.lng, e.lngLat.lat]
  },

  onMouseMove(this: DrawCustomModeThis, state: State, e: MapMouseEvent) {
    if (state.startPoint) {
      const [minX, minY] = state.startPoint
      const [maxX, maxY] = [e.lngLat.lng, e.lngLat.lat]
      state.rectangle.updateCoordinate('0.0', minX, minY)
      state.rectangle.updateCoordinate('0.1', maxX, minY)
      state.rectangle.updateCoordinate('0.2', maxX, maxY)
      state.rectangle.updateCoordinate('0.3', minX, maxY)
      state.rectangle.updateCoordinate('0.4', minX, minY)
    }
  },

  onKeyUp(this: DrawCustomModeThis, state: State, e: KeyboardEvent) {
    if (e.keyCode === 27) {
      this.changeMode('simple_select')
    }
  },

  onStop(this: DrawCustomModeThis, state: State) {
    doubleClickZoom.enable(this)
    this.updateUIClasses({ mouse: 'none' })
    this.activateUIButton()

    if (
      state.rectangle.id &&
      typeof state.rectangle.id === 'string' &&
      !this.getFeature(state.rectangle.id)
    ) {
      return
    }

    state.rectangle.removeCoordinate('0.4')

    if (state.rectangle.isValid()) {
      this.map.fire('draw.create', {
        features: [state.rectangle.toGeoJSON()],
      })
    } else if (state.rectangle.id && typeof state.rectangle.id === 'string') {
      this.deleteFeature(state.rectangle.id, { silent: true })
      this.changeMode('simple_select', {}, { silent: true })
    }
  },

  toDisplayFeatures(
    this: DrawCustomModeThis,
    state: State,
    geojson: any,
    display: (geojson: GeoJSON) => void,
  ) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id
    geojson.properties.active = isActivePolygon ? 'true' : 'false'

    if (!isActivePolygon || !state.startPoint) {
      return display(geojson)
    }

    return display(geojson)
  },

  onTrash(this: DrawCustomModeThis, state: State) {
    if (state.rectangle.id && typeof state.rectangle.id === 'string') {
      this.deleteFeature(state.rectangle.id, { silent: true })
    }

    this.changeMode('simple_select')
  },
}

export default DrawRectangle
