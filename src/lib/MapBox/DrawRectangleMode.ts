import { DrawCustomModeThis, DrawCustomMode, MapMouseEvent, DrawActionableState, MapTouchEvent, DrawPolygon } from '@mapbox/mapbox-gl-draw';
import { GeoJSON } from 'geojson'

interface State {
  startPoint?: [number, number]  
  endPoint?: [number, number]  
  rectangle: DrawPolygon
}

const doubleClickZoom = {
  enable: (ctx: any) => { // library type definition is not complete
    setTimeout(() => {
      // First check we've got a map and some context.
      if (
        !ctx.map ||
        !ctx.map.doubleClickZoom ||
        !ctx._ctx ||
        !ctx._ctx.store ||
        !ctx._ctx.store.getInitialConfigValue
      ) return  

      // Now check initial state wasn't false (we leave it disabled if so)
      if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return  
      ctx.map.doubleClickZoom.enable()  
    })  
  },
  disable: (ctx: DrawCustomModeThis) => {
    setTimeout(() => {
      if (!ctx.map || !ctx.map.doubleClickZoom) return  

      // Always disable here, as it's necessary in some cases.
      ctx.map.doubleClickZoom.disable()  
    })  
  }
}  

const DrawRectangle: DrawCustomMode = {
  // When the mode starts this function will be called.
  onSetup: function(this: DrawCustomModeThis, opts: any) {
    const rectangle = this.newFeature({
      type: "Feature",
      properties: {
        noActiveFeature: true,
      },
      geometry: {
        type: "Polygon",
        coordinates: [[]]
      }
    })  

    this.addFeature(rectangle)  
    this.clearSelectedFeatures()  
    doubleClickZoom.disable(this)  
    this.updateUIClasses({ mouse: "add" })  
    this.setActionableState({
      trash: true
    } as DrawActionableState)  

    return {
      rectangle
    }  
  },
  // support mobile taps
  onTap: function(this: any, state: State, e: MapTouchEvent) { // library type definition is not complete
    // emulate 'move mouse' to update feature coords
    if (state.startPoint) this.onMouseMove(state, e)  

    // emulate onClick
    this.onClick(state, e)  
  },
  // Whenever a user clicks on the map, Draw will call `onClick`
  onClick: function(this: DrawCustomModeThis, state: State, e: MapMouseEvent) {
    // if state.startPoint exist, means its second click
    // change to simple_select mode
    if (
      state.startPoint &&
      (state.startPoint[0] !== e.lngLat.lng ||
        state.startPoint[1] !== e.lngLat.lat)
    ) {
      this.updateUIClasses({ mouse: "pointer" })  
      state.endPoint = [e.lngLat.lng, e.lngLat.lat]  
      this.changeMode("simple_select", { featuresId: state.rectangle.id })  
    }

    // on the first click, save clicked point coords as starting for the rectangle
    const startPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]  
    state.startPoint = startPoint  
  },
  onMouseMove: function(this: DrawCustomModeThis, state: State, e: MapMouseEvent) {
    // if startPoint, update the feature coordinates, using the bounding box concept
    // we are simply using the startingPoint coordinates and the current Mouse Position
    // coordinates to calculate the bounding box on the fly, which will be our rectangle
    if (state.startPoint) {
      state.rectangle.updateCoordinate(
        "0.0",
        state.startPoint[0],
        state.startPoint[1]
      )   // minX, minY - the starting point
      state.rectangle.updateCoordinate(
        "0.1",
        e.lngLat.lng,
        state.startPoint[1]
      )   // maxX, minY
      state.rectangle.updateCoordinate("0.2", e.lngLat.lng, e.lngLat.lat)   // maxX, maxY
      state.rectangle.updateCoordinate(
        "0.3",
        state.startPoint[0],
        e.lngLat.lat
      )   // minX, maxY
      state.rectangle.updateCoordinate(
        "0.4",
        state.startPoint[0],
        state.startPoint[1]
      )   // minX, minY - ending point (equals to starting point)
    }
  },
  // Whenever a user clicks on a key while focused on the map, it will be sent here
  onKeyUp: function(this: DrawCustomModeThis, state: State, e: KeyboardEvent) {
    if (e.keyCode === 27) return this.changeMode("simple_select")  
  },
  onStop: function (this: DrawCustomModeThis, state: State) {
    doubleClickZoom.enable(this)
    this.updateUIClasses({ mouse: "none" })
    this.activateUIButton()

    // check to see if we've deleted this feature
    if (typeof state.rectangle.id === 'string' && this.getFeature(state.rectangle.id) === undefined) return;

    // Remove the last added coordinate
    state.rectangle.removeCoordinate("0.4")

    if (state.rectangle.isValid()) {  
      this.map.fire("draw.create", {
        features: [state.rectangle.toGeoJSON()],
      })
    } else {
      if (typeof state.rectangle.id === "string") {
        this.deleteFeature(state.rectangle.id, { silent: true })
      }
      this.changeMode("simple_select", {}, { silent: true })
    }
  },
  toDisplayFeatures: function (this: DrawCustomModeThis, state: State, geojson: any,  display: (geojson: GeoJSON) => void) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id
    geojson.properties.active = isActivePolygon ? "true" : "false"  

    if (!isActivePolygon) return display(geojson)  
    // Only render the rectangular polygon if it has the starting point
    if (!state.startPoint) return display(geojson)
    return display(geojson)
  },
  onTrash: function(this: DrawCustomModeThis, state: State) {
    if (typeof state.rectangle.id === "string") {
      this.deleteFeature(state.rectangle.id, { silent: true })
    }  
    this.changeMode("simple_select")  
  }
}
export default DrawRectangle
