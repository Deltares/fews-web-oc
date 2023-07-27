import { Map } from 'mapbox-gl'

export class DownloadControl {

    private _map: Map | undefined
    private _container: HTMLElement | undefined
    private _btn: HTMLButtonElement | undefined

    onAdd(map: Map) {
        this._map = map
        
        this._btn = document.createElement("button")
        this._btn.className = "mapboxgl-ctrl-download"
        this._btn.type = "button"
        this._btn.onclick = function() {
        console.log("download")
        };

        this._container = document.createElement("div")
        this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl"
        this._container.appendChild(this._btn)

        return this._container
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container)
    }
    this._map = undefined
  }
}


